import { effectivePrice, hasMenuPrice, type Product } from './menu';
import { priceForOptionLabel } from './options';
import type { Order } from './products';

/**
 * Contrôle anti-falsification : recalcule le total d'une commande web à
 * partir de la carte courante et des options re-matchées par libellé. Le
 * client n'envoie que des sélections — si un total ou un prix envoyé ne
 * correspond pas à ce que le moteur d'options calcule, la ligne est signalée
 * sur le dashboard. Les rules Firestore bornent la forme ; ce contrôle fait
 * la vérification exacte qu'elles ne peuvent pas faire (pas de Σ sur liste).
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

    // Options : le prix de chaque libellé est re-matché dans la config.
    let optionsSum = 0;
    for (const o of item.options ?? []) {
      const price = priceForOptionLabel(product, o.label);
      if (price == null) {
        issues.push(`option inconnue : ${o.label} (${item.name})`);
        optionsSum += o.price ?? 0; // on compte le prix envoyé, mais on signale
      } else {
        optionsSum += price;
      }
    }

    const unit = Math.round((base + optionsSum) * 100) / 100;
    if (Math.abs(unit - (item.price ?? 0)) > 0.011) {
      issues.push(
        `prix ligne « ${item.name} » : ${item.price?.toFixed(2)} € envoyés, ${unit.toFixed(2)} € attendus`,
      );
    }
    expected += unit * (item.qty ?? 1);
  }

  expected = Math.round(expected * 100) / 100;
  if (Math.abs(expected - (order.total ?? 0)) > 0.011) {
    issues.push(
      `total : ${order.total?.toFixed(2)} € envoyés, ${expected.toFixed(2)} € attendus`,
    );
  }

  return { ok: issues.length === 0, expected, issues };
}
