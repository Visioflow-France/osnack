import { collection, doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { createOrder, ORDERS_COLLECTION, type Order } from './products';
import { loyaltyDocRef, type LoyaltyProfile } from './loyalty';

/**
 * Envoi d'une commande web côté client.
 *
 * Sans cadeau fidélité : simple création du document `orders` (comme avant).
 *
 * Avec cadeaux (giftPoints > 0) : le débit du solde fidélité et la création
 * de la commande se jouent dans UNE SEULE transaction Firestore — impossible
 * de débiter des points sans créer la commande, ou de commander un cadeau
 * sans avoir les points (le solde est relu dans la transaction, donc un
 * double-onglet ou un solde périmé est refusé proprement).
 */
export async function submitWebOrder(
  order: Omit<Order, 'id'>,
  giftPoints: number,
): Promise<string> {
  if (!db) throw new Error('Firebase non configuré');
  if (giftPoints <= 0) return createOrder(order);

  if (!order.uid) throw new Error('gift-requires-account');

  const orderRef = doc(collection(db, ORDERS_COLLECTION));
  const userRef = loyaltyDocRef(order.uid);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    const profile = userSnap.exists()
      ? (userSnap.data() as LoyaltyProfile)
      : null;
    const balance = profile?.points ?? 0;
    if (balance < giftPoints) throw new Error('not-enough-points');

    tx.set(
      userRef,
      {
        points: balance - giftPoints,
        spent: (profile?.spent ?? 0) + giftPoints,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
    tx.set(orderRef, order);
  });

  return orderRef.id;
}
