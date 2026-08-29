'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { isAvailable, selectBestSellers, type Product } from '@/lib/menu';
import { useProducts } from '@/lib/useProducts';
import { Reveal } from './Reveal';
import { MenuCard } from './MenuCard';

/**
 * Section "Best Sellers" affichée sur la page vitrine. Ne montre que 3 plats
 * (choisis via le toggle "Best Seller" de l'admin, avec fallback robuste).
 * La carte complète vit sur la page dédiée /carte.
 * Menu fourni par le serveur (props) — aucune lecture Firestore côté client.
 */
export function BestSellers({ initialProducts }: { initialProducts?: Product[] }) {
  const { products } = useProducts(initialProducts);

  const visible = useMemo(() => products.filter(isAvailable), [products]);
  const featured = useMemo<Product[]>(
    () => selectBestSellers(visible, 3),
    [visible],
  );

  return (
    <section className="menu section-pad" id="menu">
      <div className="container">
        <Reveal className="section-label" as="div">Notre Sélection</Reveal>

        <div className="menu-header">
          <h2 className="section-title">
            Les 3
            <br />
            Best-Sellers.
          </h2>
          <p className="menu-intro">
            Les incontournables d&apos;O&apos;Snack, plébiscités par nos clients.
            Pour découvrir l&apos;intégralité de la carte — sandwichs, burgers,
            crêpes, tex-mex et milkshakes — direction notre carte complète.
          </p>
        </div>

        <div className="menu-grid bestsellers-grid" id="menuGrid">
          {featured.map((item) => (
            <MenuCard key={item.id} product={item} />
          ))}
        </div>

        <div className="bestsellers-cta">
          <Link href="/carte" className="btn" data-cursor-hover>
            Voir toute la carte <span className="btn-arrow">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
