import { effectivePrice, hasMenuPrice, type Product } from './menu';
import { recalcOptionPrices } from './options';
import { GIFT_TIERS } from './loyalty';
import type { Order } from './products';

/**
 * Contrôle anti-falsification : recalcule le total d'une commande web à
 * partir de la carte courante et des options re-matchées par libellé. Le
 * client n'envoie que des sélections — si un total ou un prix envoyé ne
 * correspond pas à ce que le moteur d'options calcule, la ligne est signalée
 * sur le dashboard. Les rules Firestore bornent la forme ; ce contrôle fait
 * la vérification exacte qu'elles ne peuvent pas faire (pas de Σ sur liste).
 *
 * Articles payés en points fidélité : leur prix doit être 0 € et ils doivent
 * correspondre EXACTEMENT à un palier GIFT_TIERS (produit + points) en
 * 1 exemplaire — sinon la ligne est signalée (cadeau falsifié).
 *
 * Limite connue : la carte de l'admin est fraîche de ≤ 5 min (ISR) — un prix
 * changé il y a moins de 5 min peut produire un faux positif.
 */
export interface OrderCheck {
  ok: boolean;
  /** Total recalculé depuis la carte. */
  expected: number;
  /** Descriptions des écarts (« option inconnue : X »…). */
  issues: string[];
}

export function checkOrderTotal(order: Order, products: Product[]): OrderCheck {
  const issues: string[] = [];
  let expected = 0;

  for (const item of order.items ?? []) {
    // Cadeau fidélité : 0 € attendu, mais palier/produit/quantité vérifiés.
    if (item.paidWithPoints) {
      const tier = GIFT_TIERS.find((t) => t.threshold === item.pointsSpent);
      if (!tier) {
        issues.push(`palier fidélité inconnu : ${item.pointsSpent ?? '—'} pts (${item.name})`);
      } else if (tier.productId !== item.productId) {
        issues.push(
          `cadeau points invalide : « ${item.name} » ne fait pas partie du palier ${tier.threshold} pts`,
        );
      }
      if ((item.price ?? 0) !== 0) {
        issues.push(`cadeau points « ${item.name} » doit être à 0 € (reçu : ${item.price?.toFixed(2)} €)`);
      }
      if ((item.qty ?? 1) !== 1) {
        issues.push(`cadeau points « ${item.name} » limité à 1 exemplaire (reçu : ${item.qty})`);
      }
      continue;
    }

    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      issues.push(`produit absent de la carte : ${item.name}`);
      expected += (item.price ?? 0) * (item.qty ?? 1);
      continue;
    }
    // Base : formule menu si demandée, sinon prix effectif (promo > normal).
    const base =
      item.variant === 'menu' && hasMenuPrice(product)
        ? (product.priceMenu as number)
        : effectivePrice(product);

    // Options : le prix de chaque libellé est re-matché dans la config
    // (groupes sauces : prix cumulé, 2 unités offertes puis supplément).
    const { sum: optionsSum, unknown } = recalcOptionPrices(product, item.options ?? []);
    for (const label of unknown) {
      issues.push(`option inconnue : ${label} (${item.name})`);
    }

    const unit = Math.round((base + optionsSum) * 100) / 100;
    if (Math.abs(unit - (item.price ?? 0)) > 0.011) {
      issues.push(
        `prix ligne « ${item.name} » : ${item.price?.toFixed(2)} € envoyés, ${unit.toFixed(2)} € attendus`,
      );
    }
    expected += unit * (item.qty ?? 1);
  }

  // Cohérence fidélité : les points annoncés au niveau commande doivent
  // correspondre à la somme des paliers des lignes cadeaux.
  const itemsPoints = (order.items ?? [])
    .filter((i) => i.paidWithPoints)
    .reduce((sum, i) => sum + (i.pointsSpent ?? 0) * (i.qty ?? 1), 0);
  const orderPoints = order.paidWithPoints ? (order.pointsSpent ?? 0) : 0;
  if (itemsPoints !== orderPoints) {
    issues.push(
      `points fidélité : ${orderPoints} pts annoncés, ${itemsPoints} pts dans les lignes`,
    );
  }

  expected = Math.round(expected * 100) / 100;
  if (Math.abs(expected - (order.total ?? 0)) > 0.011) {
    issues.push(
      `total : ${order.total?.toFixed(2)} € envoyés, ${expected.toFixed(2)} € attendus`,
    );
  }

  return { ok: issues.length === 0, expected, issues };
}
