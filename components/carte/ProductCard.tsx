'use client';

import { useState, type CSSProperties } from 'react';
import Image from 'next/image';
import {
  effectivePrice,
  hasMenuPrice,
  hasPromo,
  promoPercent,
  type Product,
} from '@/lib/menu';
import { formatPrice } from '@/lib/format';
import { computeUnitPrice, hasConfigurator } from '@/lib/options';
import { useCart } from '../CartContext';
import { ItemConfigurator } from '../cart/ItemConfigurator';

/**
 * ── Carte produit de la page Carte (style fast-food moderne) ─────────────────
 *
 * Image mise en valeur sur fond chaud neutre, badges en haut à gauche
 * (Nouveau / -% / Top Ventes / Veggie), tag série en haut à droite, titre
 * impactant, description, prix (promo barrée + prix menu) et pastille ronde
 * « + » d'ajout rapide (geste Burger King). La logique panier est celle de
 * l'ex-MenuCard : ajout express sans options, ouverture de l'ItemConfigurator
 * sinon (pain, formule, suppléments…).
 */

/** Badge « végétarien » détecté depuis le tag du produit (« Végé », « Veggie »…). */
const isVeggie = (p: Product): boolean => /vég|veggie/i.test(p.tag ?? '');

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  /** Position dans la grille : cascade l'animation d'apparition. */
  index?: number;
}) {
  const { addLine } = useCart();
  const [configuring, setConfiguring] = useState(false);
  const promo = hasPromo(product);
  const hasMenu = hasMenuPrice(product);

  function handleAdd() {
    if (hasConfigurator(product)) {
      setConfiguring(true); // pain, formule, suppléments, parfum…
    } else {
      // Ajout express : article sans options (crêpe, dessert…).
      addLine({
        productId: product.id,
        productName: product.name,
        variant: 'seul',
        options: [],
        qty: 1,
        unitPrice: computeUnitPrice(product, 'seul', []),
      });
    }
  }

  return (
    <article
      className="pcard"
      style={{ '--i': index } as CSSProperties}
    >
      <div className="pcard-media">
        <Image
          src={product.image}
          alt={`${product.name} — snack et fast food O'Snack Torcy`}
          fill
          sizes="(max-width: 700px) 50vw, (max-width: 1150px) 33vw, 25vw"
          className="pcard-img"
        />
        <div className="pcard-badges">
          {product.isNew && <span className="pcard-badge is-new">Nouveau</span>}
          {promo && (
            <span className="pcard-badge is-promo">-{promoPercent(product)} %</span>
          )}
          {product.bestseller && (
            <span className="pcard-badge is-top">Top Ventes</span>
          )}
          {isVeggie(product) && (
            <span className="pcard-badge is-veggie">Veggie</span>
          )}
        </div>
        {product.tag && <span className="pcard-tag">{product.tag}</span>}
      </div>

      <div className="pcard-body">
        <h3 className="pcard-name">{product.name}</h3>
        <p className="pcard-desc">{product.desc}</p>
        {product.note && <p className="pcard-note">{product.note}</p>}
      </div>

      <div className="pcard-footer">
        <div className="pcard-price">
          {promo && (
            <span className="price-old">{formatPrice(product.price)}</span>
          )}
          <span className="price-now">{formatPrice(effectivePrice(product))}</span>
          {hasMenu && (
            <span className="price-menu">
              Menu {formatPrice(product.priceMenu as number)}
            </span>
          )}
        </div>
        {/* Pastille ronde « + » façon BK : ajout express ou ouverture du
            configurateur selon le plat (libellé complet pour les lecteurs
            d'écran, le bouton n'affiche que le signe). */}
        <button
          type="button"
          className="pcard-add"
          onClick={handleAdd}
          aria-label={`Ajouter ${product.name} au panier`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            aria-hidden
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {configuring && (
        <ItemConfigurator product={product} onClose={() => setConfiguring(false)} />
      )}
    </article>
  );
}
