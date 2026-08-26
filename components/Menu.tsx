'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FILTER_LABELS,
  FILTER_NOTES,
  MENU_FILTERS,
  countByFilter,
  effectivePrice,
  hasMenuPrice,
  hasPromo,
  isAvailable,
  isFilter,
  matchesFilter,
  promoPercent,
  type Product,
  type Filter,
} from '@/lib/menu';
import { useProducts } from '@/lib/useProducts';
import { formatPrice } from '@/lib/format';
import { LINKS } from '@/lib/links';
import { computeUnitPrice, hasConfigurator } from '@/lib/options';
import { useCart } from './CartContext';
import { CartBar } from './cart/CartBar';
import { ItemConfigurator } from './cart/ItemConfigurator';
import { Reveal } from './Reveal';

export function Menu() {
  const [filter, setFilter] = useState<Filter>('all');
  // Menu chargé une seule fois (props serveur ISR) — aucun polling Firestore.
  const { products } = useProducts();

  // Hide dishes the admin has toggled off (soft remove). Deletion is permanent.
  const visible = useMemo(() => products.filter(isAvailable), [products]);

  const filtered = useMemo(
    () => visible.filter((p) => matchesFilter(p, filter)),
    [filter, visible],
  );

  // Filtre posé via l'URL (`/carte?cat=burgers`) par les boutons « Découvrir »
  // de la page d'accueil : active le filtre puis amène à la grille.
  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get('cat');
    if (!isFilter(cat)) return;
    setFilter(cat);
    requestAnimationFrame(() => {
      const target = document.getElementById('menuGrid') ?? document.getElementById('menu');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  return (
    <section className="menu section-pad" id="menu">
      <div className="container">
        <Reveal className="section-label" as="div">Notre Carte</Reveal>

        <div className="menu-header">
          <h2 className="section-title">
            Le menu
            <br />
            O&apos;Snack.
          </h2>
          <p className="menu-intro">
            Kebabs et sandwichs au four, burgers du classique au gourmet, crêpes,
            tex-mex et milkshakes maison. Commandez en ligne avec paiement au
            retrait, par téléphone ou directement sur place — aussi sur Uber Eats
            et Deliveroo.
          </p>
        </div>

        <div className="menu-order-info" role="note">
          <div className="menu-order-info-main">
            <span className="menu-order-info-eyebrow">Comment commander</span>
            <p className="menu-order-info-text">
              <strong>En ligne</strong> (paiement au retrait : espèces ou carte),{' '}
              <strong>par téléphone</strong> ou <strong>sur place</strong> — aussi
              sur Uber Eats &amp; Deliveroo.
            </p>
          </div>
          <div className="menu-order-info-actions">
            <Link href="/commander" className="menu-order-info-online" data-cursor-hover>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="17" cy="20" r="1.4" />
                <path d="M3 3h2.2l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h7.6a1.6 1.6 0 0 0 1.6-1.3L20 7H5.4" />
              </svg>
              <span>Commander en ligne</span>
            </Link>
            <a href={LINKS.phoneHref} className="menu-order-info-phone" data-cursor-hover>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{LINKS.phone}</span>
            </a>
            <span className="menu-order-info-place">
              57 Rue de Paris, 77220 Torcy · Sur place
            </span>
          </div>
        </div>

        <div className="filters" id="filters">
          {MENU_FILTERS.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {FILTER_LABELS[cat]} <span className="count">({countByFilter(cat, visible)})</span>
            </button>
          ))}
        </div>

        {filter !== 'all' && FILTER_NOTES[filter] && (
          <p className="menu-cat-note">{FILTER_NOTES[filter]}</p>
        )}

        <div className="menu-grid" id="menuGrid">
          {filtered.map((item) => (
            <MenuCard key={item.id} product={item} orderable />
          ))}
        </div>
      </div>

      {/* Retour visuel immédiat du panier, dès le premier article ajouté. */}
      <CartBar />
    </section>
  );
}

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
