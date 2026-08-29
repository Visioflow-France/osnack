'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FILTER_LABELS,
  FILTER_NOTES,
  MENU_FILTERS,
  countByFilter,
  isAvailable,
  isFilter,
  matchesFilter,
  type Filter,
  type Product,
} from '@/lib/menu';
import { useProducts } from '@/lib/useProducts';
import { LINKS } from '@/lib/links';
import { CartBar } from './cart/CartBar';
import { CategoryBubbles, type BubbleItem } from './carte/CategoryBubbles';
import { ProductCard } from './carte/ProductCard';
import { Reveal } from './Reveal';

/**
 * ── Page « Notre Carte » (refonte style Burger King) ─────────────────────────
 *
 * Structure :
 *   1. En-tête éditorial + rappel des canaux de commande (inchangé).
 *   2. Bandeau de bulles filtrantes (photos circulaires, scroll-snap mobile,
 *      bulle active recentrée automatiquement) — filtrage instantané, sans
 *      rechargement.
 *   3. Grille de cartes produits responsives (2 col. mobile → 4 col. desktop)
 *      avec badges Nouveau / -% / Top Ventes / Veggie et ajout panier express.
 *
 * La logique métier est conservée : menu chargé une seul fois (ISR serveur,
 * fetch de rattrapage sinon), panier via CartContext + ItemConfigurator,
 * filtre posable par l'URL (`/carte?cat=burgers`, boutons « Découvrir »).
 */
export function Menu({ initialProducts }: { initialProducts?: Product[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  // Menu chargé une seule fois (props serveur ISR) — aucun polling Firestore.
  const { products } = useProducts(initialProducts);

  // Hide dishes the admin has toggled off (soft remove). Deletion is permanent.
  const visible = useMemo(() => products.filter(isAvailable), [products]);

  const filtered = useMemo(
    () => visible.filter((p) => matchesFilter(p, filter)),
    [filter, visible],
  );

  // Données du bandeau de bulles : une bulle par filtre, photo de couverture =
  // image du 1er plat du filtre (auto-maintenue quand l'admin change la carte).
  // La bulle « Nouveautés » n'apparaît que si au moins un plat est marqué neuf.
  const bubbles = useMemo<BubbleItem[]>(() => {
    const out: BubbleItem[] = [];
    for (const f of MENU_FILTERS) {
      const count = countByFilter(f, visible);
      if (f === 'nouveautes' && count === 0) continue;
      const cover = visible.find((p) => matchesFilter(p, f))?.image;
      if (!cover) continue;
      out.push({ id: f, label: FILTER_LABELS[f], count, image: cover });
    }
    return out;
  }, [visible]);

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
    <section className="menu carte section-pad" id="menu">
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
      </div>

      {/* Bandeau bulles collant sous la nav pendant le défilement (style BK). */}
      <div className="carte-bubbles-wrap">
        <div className="container">
          <CategoryBubbles items={bubbles} active={filter} onChange={setFilter} />
        </div>
      </div>

      <div className="container">
        {FILTER_NOTES[filter] && (
          <p className="menu-cat-note" aria-live="polite">{FILTER_NOTES[filter]}</p>
        )}

        {/* key={filter} : la grille se ré-anime en cascade à chaque filtre. */}
        <div className="carte-grid" id="menuGrid" key={filter}>
          {filtered.length === 0 ? (
            <div className="carte-empty">
              Aucun plat dans cette catégorie pour le moment — revenez bientôt.
            </div>
          ) : (
            filtered.map((item, i) => (
              <ProductCard key={item.id} product={item} index={i} />)
            )
          )}
        </div>
      </div>

      {/* Retour visuel immédiat du panier, dès le premier article ajouté. */}
      <CartBar />
    </section>
  );
}
