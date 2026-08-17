import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { MENU, type Product } from './menu';

/**
 * Programme de fidélité O'Snack.
 *
 * Barème : 1 € dépensé = 1 point. Les commandes passant par téléphone /
 * sur place / plateformes, les points ne peuvent pas être crédités
 * automatiquement — le restaurant génère un code depuis l'admin, le client
 * le saisit dans son compte. Les cadeaux se déboursent par paliers de
 * points sur les articles de la carte.
 */

/** Collection Firestore du profil fidélité de chaque client. */
export const USERS_COLLECTION = 'loyalty_users';
/** Collection Firestore des codes générés par le restaurant. */
export const CODES_COLLECTION = 'loyalty_codes';

/** 1 € dépensé = 1 point (arrondi à l'entier inférieur). */
export function pointsForAmount(amountEur: number): number {
  return Math.max(0, Math.floor(amountEur));
}

/** Paliers de cadeaux : seuil en points → article de la carte offert. */
export interface GiftTier {
  threshold: number;
  label: string;
  /** id de l'article dans la carte (products / MENU). */
  productId: string;
}

export const GIFT_TIERS: GiftTier[] = [
  { threshold: 50, label: 'Boisson offerte', productId: 'boisson-33' },
  { threshold: 100, label: 'Dessert offert', productId: 'd-tiramisu' },
  { threshold: 150, label: 'Sandwich offert', productId: 'grec' },
  { threshold: 250, label: 'Menu offert', productId: 'menu-supreme' },
];

/** Profil fidélité d'un client (doc Firestore, hors identité Firebase Auth). */
export interface LoyaltyProfile {
  points: number;
  /** Points déjà dépensés sur des cadeaux (historique cumulé). */
  spent: number;
  createdAt?: number;
  updatedAt?: number;
}

/** Code de fidélité remis au client après une commande. */
export interface LoyaltyCode {
  /** Le code lui-même (ex. OS-4F7B2K), utilisé comme id Firestore. */
  code: string;
  /** Points crédités une fois le code saisi. */
  points: number;
  /** Montant de la commande en € (1 € = 1 pt), stocké pour mémoire. */
  amountEur?: number;
  /** Statut : disponible, déjà utilisé, ou annulé par le restaurant. */
  status: 'available' | 'redeemed' | 'cancelled';
  /** uid Firebase Auth du client qui a utilisé le code. */
  redeemedBy?: string;
  redeemedAt?: number;
  createdAt: number;
  createdBy?: string;
}

/** Génère un code lisible type OS-XXXXXX (sans caractères ambigus). */
export function generateCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let body = '';
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(6);
    cryptoObj.getRandomValues(bytes);
    for (const b of bytes) body += alphabet[b % alphabet.length];
  } else {
    for (let i = 0; i < 6; i++)
      body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `OS-${body}`;
}

/** Référence du profil d'un client. */
export function loyaltyDocRef(uid: string) {
  return doc(db!, USERS_COLLECTION, uid);
}

/**
 * Assure la présence du profil (points: 0) à la première connexion,
 * puis le souscrit en temps réel. Retourne la fonction de désinscription.
 */
export function subscribeLoyalty(
  uid: string,
  cb: (profile: LoyaltyProfile | null) => void,
): () => void {
  if (!isFirebaseConfigured || !db) {
    cb(null);
    return () => {};
  }
  const ref = loyaltyDocRef(uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        cb(snap.data() as LoyaltyProfile);
      } else {
        // Première connexion : création du profil avec 0 point.
        setDoc(ref, { points: 0, spent: 0, createdAt: Date.now() }).catch(() => {});
        cb({ points: 0, spent: 0 });
      }
    },
    (err) => {
      console.error('[loyalty] subscribe failed:', err);
      cb(null);
    },
  );
}

/** Crée un code côté restaurant (admin). */
export async function createLoyaltyCode(
  points: number,
  opts?: { amountEur?: number; createdBy?: string },
): Promise<string> {
  if (!db) throw new Error('Firebase non configuré');
  const code = generateCode();
  await setDoc(doc(db, CODES_COLLECTION, code), {
    code,
    points,
    amountEur: opts?.amountEur ?? null,
    status: 'available',
    createdAt: Date.now(),
    createdBy: opts?.createdBy ?? null,
  });
  return code;
}

/** Liste en temps réel des codes (admin). */
export function subscribeLoyaltyCodes(
  cb: (codes: LoyaltyCode[]) => void,
): () => void {
  if (!isFirebaseConfigured || !db) {
    cb([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, CODES_COLLECTION)),
    (snap) => {
      const codes = snap.docs.map((d) => d.data() as LoyaltyCode);
      codes.sort((a, b) => b.createdAt - a.createdAt);
      cb(codes);
    },
    (err) => {
      console.error('[loyalty-codes] subscribe failed:', err);
      cb([]);
    },
  );
}

/** Résultat de la saisie d'un code par un client. */
export type RedeemResult =
  | { ok: true; points: number; newBalance: number }
  | { ok: false; error: 'not-found' | 'used' | 'cancelled' | 'network' };

/**
 * Saisie d'un code par le client connecté, en transaction pour éviter
 * qu'un même code soit utilisé deux fois (double-clic, deux onglets…).
 */
export async function redeemCode(
  uid: string,
  rawCode: string,
): Promise<RedeemResult> {
  if (!db) return { ok: false, error: 'network' };
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: 'not-found' };

  try {
    const newBalance = await runTransaction(db, async (tx) => {
      const codeRef = doc(db!, CODES_COLLECTION, code);
      const codeSnap = await tx.get(codeRef);
      if (!codeSnap.exists()) throw new Error('not-found');
      const data = codeSnap.data() as LoyaltyCode;
      if (data.status === 'redeemed') throw new Error('used');
      if (data.status === 'cancelled') throw new Error('cancelled');

      const userRef = loyaltyDocRef(uid);
      const userSnap = await tx.get(userRef);
      const current = userSnap.exists()
        ? ((userSnap.data() as LoyaltyProfile).points ?? 0)
        : 0;
      const next = current + (data.points ?? 0);

      tx.update(codeRef, {
        status: 'redeemed',
        redeemedBy: uid,
        redeemedAt: Date.now(),
      });
      tx.set(
        userRef,
        {
          points: next,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
      return next;
    });
    return { ok: true, points: 0, newBalance };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'network';
    if (msg.includes('not-found')) return { ok: false, error: 'not-found' };
    if (msg.includes('used')) return { ok: false, error: 'used' };
    if (msg.includes('cancelled')) return { ok: false, error: 'cancelled' };
    return { ok: false, error: 'network' };
  }
}

/** Échange des points contre un cadeau (client, au comptoir). */
export async function claimGift(
  uid: string,
  tier: GiftTier,
): Promise<{ ok: boolean; error?: string }> {
  if (!db) return { ok: false, error: 'Firebase non configuré' };
  try {
    await runTransaction(db, async (tx) => {
      const userRef = loyaltyDocRef(uid);
      const snap = await tx.get(userRef);
      if (!snap.exists()) throw new Error('no-points');
      const profile = snap.data() as LoyaltyProfile;
      if ((profile.points ?? 0) < tier.threshold) throw new Error('not-enough');
      tx.set(
        userRef,
        {
          points: profile.points - tier.threshold,
          spent: (profile.spent ?? 0) + tier.threshold,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return { ok: false, error: msg };
  }
}

/** Normalise la saisie : OS-4f7b2k → OS-4F7B2K (l'utilisateur oublie souvent le préfixe). */
export function normalizeCode(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return cleaned.startsWith('OS') ? `OS-${cleaned.slice(2)}` : '';
}

/** Récupère l'article de la carte correspondant à un palier (menu statique en secours). */
export function giftProduct(tier: GiftTier): Product | undefined {
  return MENU.find((p) => p.id === tier.productId);
}
