'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import { isAvailable, selectBestSellers, type Product } from '@/lib/menu';
import { useProducts } from '@/lib/useProducts';
import { Reveal } from './Reveal';
import { MenuCard } from './Menu';

/**
 * Section « Sélectionné pour vous » — carrousel horizontal à la Burger King.
 * Montre jusqu'à 8 plats (choisis via le toggle "Best Seller" de l'admin,
 * avec fallback robuste). La carte complète vit sur la page dédiée /carte.
 */
export function BestSellers() {
  const { products } = useProducts();
  const trackRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => products.filter(isAvailable), [products]);
  const featured = useMemo<Product[]>(
    () => selectBestSellers(visible, 8),
    [visible],
  );

  // Défilement par "page" (une largeur de carte) via les flèches.
  const scrollBy = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>('.bestsellers-card');
    const step = card ? card.offsetWidth + 24 : track.clientWidth * 0.8;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className="menu section-pad bestsellers" id="menu">
      <div className="container">
        <Reveal className="section-label" as="div">Notre Sélection</Reveal>

        <div className="menu-header">
          <h2 className="section-title">
            Sélectionné
            <br />
            pour vous.
          </h2>
          <div className="bestsellers-header-right">
            <p className="menu-intro">
              Les incontournables d&apos;O&apos;Snack, plébiscités par nos
              clients. Faites défiler pour découvrir nos spécialités.
            </p>
            <div className="bestsellers-arrows">
              <button
                className="bestsellers-arrow"
                onClick={() => scrollBy(-1)}
                aria-label="Voir les plats précédents"
                data-cursor-hover
              >
                ←
              </button>
              <button
                className="bestsellers-arrow"
                onClick={() => scrollBy(1)}
                aria-label="Voir les plats suivants"
                data-cursor-hover
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bestsellers-track-wrap container-wide">
        <div className="bestsellers-track" ref={trackRef}>
          {featured.map((item) => (
            <div className="bestsellers-card" key={item.id}>
              <MenuCard product={item} />
            </div>
          ))}
          {/* Carte finale "voir plus" — ferme le carrousel sur la carte complète. */}
          <Link href="/carte" className="bestsellers-more" data-cursor-hover>
            <span className="bestsellers-more-title">
              Voir
              <br />
              plus
            </span>
            <span className="bestsellers-more-arrow">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
