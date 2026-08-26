import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { MENU, type Product } from './menu';
import { deleteDishImageByUrl } from './storage';
import {
  addMenuItem,
  patchMenuItem,
  removeMenuItem,
  saveMenu,
} from './menuDoc';

/**
 * ── Data-layer ADMIN ─────────────────────────────────────────────────────────
 *
 * Le site public lit le document unique `menu/vitrine` via /api/menu (cache
 * ISR). L'admin écrit dans ce même document : chaque modification (prix,
 * dispo…) = 1 read + 1 write, visible publiquement à la revalidation ISR
 * suivante (≤ 5 min) — sans aucune boucle de requêtes côté client public.
 *
 * La collection `orders` reste la SEULE écoute temps réel (onSnapshot),
 * réservée au dashboard cuisine/admin.
 */

/** Firestore collection pour les commandes (écoute temps réel cuisine). */
export const ORDERS_COLLECTION = 'orders';
/** Legacy : collection historique utilisée avant l'agrégation en 1 document. */
export const PRODUCTS_COLLECTION = 'products';

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  /** Prix UNITAIRE, options incluses (sémantique inchangée). */
  price: number;
  /** Présent si l'article est commandé en formule menu (priceMenu). */
  variant?: 'menu';
  /** Résumé lisible des options (« Menu · Tortillas · + Bacon »). */
  optionsSummary?: string;
  /** Options structurées, pour le re-calcul admin anti-fraude. */
  options?: { label: string; price: number }[];
}

/** Canal d'origine d'une commande — absent = comptoir (commandes historiques). */
export type OrderChannel = 'web' | 'comptoir';

/** Modalité de retrait d'une commande web. */
export interface OrderPickup {
  mode: 'asap' | 'scheduled';
  /** ms epoch du créneau (mode scheduled uniquement). */
  at?: number;
}

export interface Order {
  id: string;
  reference: string;
  /** 'nouvelle' | 'en_cours' | 'prete' | 'livree' | 'annulee' */
  status: string;
  /** Absent = 'comptoir' (rétro-compatible avec les commandes existantes). */
  channel?: OrderChannel;
  pickup?: OrderPickup;
  customerName?: string;
  customerPhone?: string;
  /** Email du compte fidélité (recherche comptoir / commande web liée). */
  customerEmail?: string;
  /** uid Firebase Auth du client connecté (commande web liée au compte). */
  uid?: string;
  /** Précisions / allergies saisies par le client (commande web). */
  note?: string;
  /** Points fidélité crédités au passage en « livree » (garde anti-double-crédit). */
  pointsCredited?: number;
  /** True si la commande a été réglée en points de fidélité. */
  paidWithPoints?: boolean;
  items: OrderItem[];
  total: number;
  /** ms epoch */
  createdAt: number;
}

/** Créer un plat : écrit dans le document menu unique. */
export async function createProduct(
  data: Omit<Product, 'id'>,
): Promise<string> {
  const items = await addMenuItem(data);
  return items[items.length - 1]?.id ?? '';
}

/** Patch un plat (prix, dispo, image…) dans le document menu unique. */
export async function updateProduct(
  id: string,
  patch: Partial<Omit<Product, 'id'>>,
): Promise<void> {
  await patchMenuItem(id, patch);
}

/**
 * Supprime définitivement un plat ET son image Firebase Storage associée.
 * Les images externes (Unsplash…) sont ignorées — rien à nettoyer chez nous.
 */
export async function removeProduct(product: Product | string): Promise<void> {
  const p = typeof product === 'string' ? null : product;
  if (p) await deleteDishImageByUrl(p.image); // nettoyage Storage d'abord
  await removeMenuItem(typeof product === 'string' ? product : p!.id);
}

/** Remplace le document menu unique par le menu statique (seed). */
export async function seedProducts(): Promise<void> {
  await saveMenu(MENU);
}

/**
 * Écoute temps réel des COMMANDES — réservée au dashboard admin/cuisine.
 * C'est la seule écoute onSnapshot autorisée dans toute l'application.
 */
export function subscribeToOrders(cb: (orders: Order[]) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    cb([]);
    return () => {};
  }
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const orders: Order[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Order, 'id'>),
      }));
      cb(orders);
    },
    (err) => {
      console.error('[orders] subscribe failed:', err);
      cb([]);
    },
  );
}

/**
 * Met à jour le statut d'une commande (utilisé par le dashboard cuisine).
 */
export async function updateOrderStatus(
  id: string,
  status: Order['status'],
): Promise<void> {
  if (!db) throw new Error('Firebase non configuré');
  await setDoc(doc(db, ORDERS_COLLECTION, id), { status }, { merge: true });
}

/** Crée une commande (côté cuisine, réception téléphone/comptoir). */
export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
  if (!db) throw new Error('Firebase non configuré');
  const ref = await addDoc(collection(db, ORDERS_COLLECTION), order);
  return ref.id;
}

/** Supprime une commande. */
export async function deleteOrder(id: string): Promise<void> {
  if (!db) throw new Error('Firebase non configuré');
  await deleteDoc(doc(db, ORDERS_COLLECTION, id));
}
