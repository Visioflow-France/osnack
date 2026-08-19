import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

/**
 * ── Espace client & fidélité ─────────────────────────────────────────────────
 *
 * Comptes clients Firebase Auth (email + mot de passe). Le solde de points et
 * l'historique vivent dans Firestore, un document par client :
 *
 *   customers/{uid}  { points, lifetime, createdAt, updatedAt }
 *   customers/{uid}/history/{entryId}  { delta, reason, createdAt }
 *
 * Coût forfait Spark : l'écoute du profil utilise onSnapshot ciblé sur UN
 * document (les snapshots de document ne comptent des lectures qu'au moment
 * où le contenu change réellement — usage anecdotique pour un compte ouvert
 * par son propriétaire). Aucun polling, aucune requête en boucle.
 */

/** Collection des profils clients (1 document par compte). */
export const CUSTOMERS_COLLECTION = 'customers';
/** Sous-collection de l'historique des points. */
export const HISTORY_COLLECTION = 'history';

/** Points nécessaires pour 1 euro de remise. */
export const POINTS_PER_EURO = 10;

export interface CustomerProfile {
  points: number;
  /** Total cumulé depuis l'inscription (jamais décrémenté). */
  lifetime: number;
  displayName?: string;
  /** Email dénormalisé pour la recherche comptoir (minuscules). */
  email?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PointsEntry {
  id: string;
  /** Positif = gain, négatif = utilisation. */
  delta: number;
  reason: string;
  createdAt: number;
}

export const isAuthAvailable = () =>
  isFirebaseConfigured && Boolean(auth && db);

/* ------------------------------ Authentification ----------------------------- */

export async function registerCustomer(
  email: string,
  password: string,
  displayName?: string,
): Promise<User> {
  if (!auth || !db) throw new Error('Firebase non configuré');
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName?.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  // Document profil initial : 0 point, historique vide.
  await setDoc(doc(db, CUSTOMERS_COLLECTION, cred.user.uid), {
    points: 0,
    lifetime: 0,
    email: email.trim().toLowerCase(),
    ...(displayName?.trim() ? { displayName: displayName.trim() } : {}),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return cred.user;
}

export async function loginCustomer(
  email: string,
  password: string,
): Promise<User> {
  if (!auth) throw new Error('Firebase non configuré');
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function logoutCustomer(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export async function resetCustomerPassword(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase non configuré');
  await sendPasswordResetEmail(auth, email.trim());
}

/** Observer d'état de connexion (une seule instance par page /compte). */
export function watchAuth(cb: (user: User | null) => void): () => void {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}

/* ---------------------------------- Points ---------------------------------- */

/**
 * Crée le profil s'il manque (client Auth existant avant le déploiement
 * fidélité) — évite d'afficher « introuvable » à un ancien compte.
 */
async function ensureProfile(uid: string): Promise<CustomerProfile> {
  if (!db) throw new Error('Firebase non configuré');
  const ref = doc(db, CUSTOMERS_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as CustomerProfile;
  const profile: CustomerProfile = {
    points: 0,
    lifetime: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(ref, profile);
  return profile;
}

/**
 * Écoute du profil client (1 document). Réservé à l'espace compte ouvert par
 * son propriétaire — pas de boucle, déconnexion = unsubscribe.
 */
export function watchProfile(
  uid: string,
  cb: (profile: CustomerProfile | null) => void,
): () => void {
  if (!db) {
    cb(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, CUSTOMERS_COLLECTION, uid),
    (snap) => {
      if (!snap.exists()) {
        // Profil manquant : le créer puis re-notifier à la prochaine écriture.
        ensureProfile(uid)
          .then(cb)
          .catch((err) => console.warn('[loyalty] init profil :', err));
        cb({ points: 0, lifetime: 0, createdAt: 0, updatedAt: 0 });
        return;
      }
      cb(snap.data() as CustomerProfile);
    },
    (err) => {
      console.warn('[loyalty] écoute profil :', err);
      cb(null);
    },
  );
}

/**
 * Écrit un mouvement de points + met à jour le solde (transaction logique en
 * 2 écritures). `delta` positif pour un gain, négatif pour une utilisation.
 * Côté admin/comptoir : crédite lors d'une commande enregistrée.
 */
export async function addPoints(
  uid: string,
  delta: number,
  reason: string,
): Promise<void> {
  if (!db) throw new Error('Firebase non configuré');
  const profile = await ensureProfile(uid);
  const points = Math.max(0, profile.points + delta);
  const lifetime =
    delta > 0 ? profile.lifetime + delta : profile.lifetime;
  await setDoc(doc(db, CUSTOMERS_COLLECTION, uid), {
    ...profile,
    points,
    lifetime,
    updatedAt: Date.now(),
  });
  await setDoc(
    doc(db, CUSTOMERS_COLLECTION, uid, HISTORY_COLLECTION, `e-${Date.now()}`),
    { delta, reason, createdAt: Date.now() },
  );
}

/**
 * Utilise des points (débit). Rejette si le solde est insuffisant.
 * @returns le nouveau solde.
 */
export async function spendPoints(
  uid: string,
  amount: number,
  reason: string,
): Promise<number> {
  if (amount <= 0) throw new Error('Montant invalide');
  const profile = await ensureProfile(uid);
  if (profile.points < amount) throw new Error('Solde de points insuffisant');
  await addPoints(uid, -amount, reason);
  return profile.points - amount;
}

/**
 * Historique des 20 derniers mouvements (lecture ponctuelle, à la demande —
 * affiché à l'ouverture de l'espace compte uniquement).
 */
export async function getHistory(uid: string, limitCount = 20): Promise<PointsEntry[]> {
  if (!db) return [];
  const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
  const q = query(
    collection(db, CUSTOMERS_COLLECTION, uid, HISTORY_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PointsEntry, 'id'>) }));
}

/** Recherche un client par email (annuaire, côté comptoir). */
export async function findCustomerUidByEmail(
  email: string,
): Promise<string | null> {
  if (!db) return null;
  const { collection, getDocs, query, where, limit } = await import('firebase/firestore');
  const q = query(
    collection(db, CUSTOMERS_COLLECTION),
    where('email', '==', email.trim().toLowerCase()),
    limit(1),
  );
  const snap = await getDocs(q);
  return snap.docs[0]?.id ?? null;
}

/**
 * Recherche un client par email et renvoie uid + solde — utilisé par le
 * comptoir pour afficher les points en direct pendant la saisie de commande.
 * Lecture ponctuelle (2 reads max), à la demande uniquement.
 */
export async function lookupCustomerByEmail(
  email: string,
): Promise<{ uid: string; profile: CustomerProfile } | null> {
  const uid = await findCustomerUidByEmail(email);
  if (!uid) return null;
  const snap = await getDoc(doc(db!, CUSTOMERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return { uid, profile: snap.data() as CustomerProfile };
}

/** Nom du champ email dans l'index. */
export const CUSTOMER_EMAIL_FIELD = 'email';

/**
 * Création d'un compte client PAR L'ADMIN, depuis le comptoir.
 * Utilise une app Firebase secondaire : la session admin reste intacte.
 * Retourne uid + profil du nouveau client (0 point).
 */
export async function adminCreateCustomer(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ uid: string; profile: CustomerProfile }> {
  const { withSecondaryAuth } = await import('./firebase');
  const uid = await withSecondaryAuth(async (secondaryAuth) => {
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim().toLowerCase(),
      password,
    );
    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    return cred.user.uid;
  });

  const profile: CustomerProfile = {
    points: 0,
    lifetime: 0,
    email: email.trim().toLowerCase(),
    ...(displayName?.trim() ? { displayName: displayName.trim() } : {}),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(doc(db!, CUSTOMERS_COLLECTION, uid), profile);
  return { uid, profile };
}

/** Met à jour le champ email dénormalisé du profil (après inscription). */
export async function setCustomerEmail(uid: string, email: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, CUSTOMERS_COLLECTION, uid), {
    email: email.trim().toLowerCase(),
  }).catch(() => {
    /* le document n'existe pas encore : création silencieuse à la prochaine écriture */
  });
}

/** Euros équivalents à un solde de points (affichage « = X,XX € »). */
export const pointsToEuros = (points: number): number =>
  Math.round((points / POINTS_PER_EURO) * 100) / 100;
