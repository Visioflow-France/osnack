import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { ORDERS_COLLECTION, type Order } from './products';
import { loyaltyDocRef, pointsForAmount, type LoyaltyProfile } from './loyalty';

/**
 * Passage d'une commande en « livrée » (retirée & réglée au comptoir) avec
 * CRÉDIT AUTOMATIQUE des points fidélité pour les commandes web liées à un
 * compte (1 € = 1 pt). Tout se joue en UNE transaction : statut + points —
 * le champ `pointsCredited` relu dans la transaction garantit qu'un double
 * clic ne crédite jamais deux fois.
 *
 * @returns le nombre de points crédités (0 si aucun).
 */
export async function deliverOrderAndCredit(order: Order): Promise<number> {
  if (!db) throw new Error('Firebase non configuré');
  if (!order.uid || order.channel !== 'web' || order.paidWithPoints) {
    // Comptoir (fidélité par code) ou commande invité : statut seul.
    await runTransaction(db, async (tx) => {
      const ref = doc(db!, ORDERS_COLLECTION, order.id);
      const snap = await tx.get(ref);
      if (snap.exists() && snap.data().status !== 'livree') {
        tx.update(ref, { status: 'livree' });
      }
    });
    return 0;
  }

  const points = pointsForAmount(order.total ?? 0);
  const orderRef = doc(db, ORDERS_COLLECTION, order.id);
  const userRef = loyaltyDocRef(order.uid);

  await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) return;
    const data = orderSnap.data() as Order;

    // Déjà livrée ou déjà créditée → rien (idempotence).
    if (data.status === 'livree' || data.pointsCredited != null) {
      if (data.status !== 'livree') tx.update(orderRef, { status: 'livree' });
      return;
    }

    const userSnap = await tx.get(userRef);
    const current = userSnap.exists() ? ((userSnap.data() as LoyaltyProfile).points ?? 0) : 0;

    tx.update(orderRef, { status: 'livree', pointsCredited: points });
    tx.set(
      userRef,
      {
        points: current + points,
        // Profil créé au premier crédit s'il n'existe pas encore.
        ...(userSnap.exists() ? {} : { spent: 0, createdAt: Date.now() }),
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  });

  return points;
}
