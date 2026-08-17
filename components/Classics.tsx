'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { isAvailable, type Product } from '@/lib/menu';
import { useProducts } from '@/lib/useProducts';
import { Reveal } from './Reveal';
import { MenuCard } from './Menu';

/**
 * Section « Découvrez nos classiques » — l'équivalent BK : après le carrousel
 * "Sélectionné pour vous", une seconde salve de produits (les grandes
 * catégories de la carte) avec les CTA "Voir plus" / "Consulter la carte".
 */
export function Classics() {
  const { products } = useProducts();

  // Un échantillon par grande famille : sandwich, burger, menu, crêpe, dessert.
  const CLASSIC_IDS = [
    'grec',
    'b-double-cheese',
    'menu-supreme',
    'crepe-nutella',
    'd-tiramisu',
    'ms-oreo',
  ];

  const visible = useMemo(() => products.filter(isAvailable), [products]);
  const classics = useMemo<Product[]>(() => {
    const byId = new Map(visible.map((p) => [p.id, p] as const));
    const picked = CLASSIC_IDS.map((id) => byId.get(id)).filter(
      (p): p is Product => Boolean(p),
    );
    return picked.length > 0
      ? picked
      : visible.slice(0, 6);
  }, [visible]);

  return (
    <section className="menu section-pad classics" id="classics">
      <div className="container">
        <Reveal className="section-label" as="div">Notre Carte</Reveal>

        <div className="menu-header">
          <h2 className="section-title">
            Découvrez
            <br />
            nos classiques.
          </h2>
          <div className="classics-header-right">
            <p className="menu-intro">
              Sandwichs au four, burgers généreux, crêpes maison, desserts et
              milkshakes — un tour d&apos;horizon de ce qu&apos;on fait de mieux.
            </p>
            <div className="classics-ctas">
              <Link href="/carte" className="btn btn-primary" data-cursor-hover>
                Consulter la carte <span className="btn-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="menu-grid bestsellers-grid">
          {classics.map((item) => (
            <MenuCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
