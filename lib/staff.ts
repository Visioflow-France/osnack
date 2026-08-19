/**
 * ── Admin unique ─────────────────────────────────────────────────────────────
 *
 * Un seul compte a accès au dashboard /admin : claytonmicillo2009@gmail.com.
 * Tous les autres comptes Firebase Auth sont des CLIENTS (espace /compte).
 *
 * La vérification est triple et cohérente :
 *   1. firestore.rules → isAdmin() verrouillé sur l'UID (sécurité réelle) ;
 *   2. lib/staff.ts    → isStaffUser() même UID (contrôle UI) ;
 *   3. /compte         → si un admin s'y connecte, il est redirigé vers /admin.
 *
 * Pour changer d'admin : modifier l'UID ici ET dans firestore.rules,
 * puis `firebase deploy --only firestore:rules --project o-snack`.
 */

/** UID du compte admin unique (Authentication → Users). */
export const ADMIN_UID = 'Fqbbqe5i2qdp3g7zuOT6Hpxv6aC3';

/** Vérifie si l'utilisateur connecté est l'admin unique. */
export function isStaffUser(uid: string): boolean {
  return uid === ADMIN_UID;
}
