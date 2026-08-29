'use client';

import { useEffect, useRef, useState } from 'react';
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
import { useCart } from './CartContext';
import { ItemConfigurator } from './cart/ItemConfigurator';

/**
 * Carte produit « vitrine » de la page d'accueil (section Best Sellers).
 * La page /carte utilise désormais `carte/ProductCard` (style bulles/fast-food) ;
 * ce composant reste dédié à l'accueil pour ne pas changer son rendu.
 */
export function MenuCard({ product, orderable }: { product: Product; orderable?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { addLine } = useCart();
  const [configuring, setConfiguring] = useState(false);
  const promo = hasPromo(product);
  const hasMenu = hasMenuPrice(product);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible');
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="menu-card" ref={ref}>
      <div className="menu-card-img">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
        />
        {product.tag && <div className="menu-card-tag">{product.tag}</div>}
        {promo && (
          <div className="menu-card-tag promo">-{promoPercent(product)} %</div>
        )}
      </div>
      <div className="menu-card-body">
        <h3 className="menu-card-name">{product.name}</h3>
        <p className="menu-card-desc">{product.desc}</p>
        {product.note && <p className="menu-card-note">{product.note}</p>}
        <div className="menu-card-footer">
          <div className={`menu-card-price ${promo ? 'is-promo' : ''} ${hasMenu ? 'has-menu' : ''}`}>
            <span className="price-main">
              {promo && <span className="price-old">{formatPrice(product.price)}</span>}
              <span className="price-now">
                {formatPrice(effectivePrice(product))}
              </span>
            </span>
            {hasMenu && (
              <span className="price-menu">Menu {formatPrice(product.priceMenu as number)}</span>
            )}
          </div>
          {orderable && (
            <button
              type="button"
              className="menu-card-add"
              onClick={() => {
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
              }}
            >
              Ajouter
            </button>
          )}
        </div>
      </div>

      {configuring && (
        <ItemConfigurator product={product} onClose={() => setConfiguring(false)} />
      )}
    </article>
  );
}
