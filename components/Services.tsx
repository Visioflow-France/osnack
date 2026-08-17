'use client';

import { useEffect, useRef } from 'react';
import { LINKS } from '@/lib/links';
import { Reveal } from './Reveal';
import { UberEatsLogo, DeliverooLogo } from './BrandLogos';

/**
 * Équivalent de la section BK « Choisissez le service qui vous ressemble ».
 * O'Snack n'a ni drive ni app : on met en avant le téléphone comme moyen
 * principal de commande, avec les plateformes de livraison en complément.
 * Les tuiles sont des <a> cliquables révélées au scroll (pattern MenuCard).
 */
export function Services() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const tiles = Array.from(grid.querySelectorAll<HTMLElement>('.services-tile'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    tiles.forEach((tile) => observer.observe(tile));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="services section-pad" id="services">
      <div className="container">
        <Reveal className="section-label" as="div">Nos services</Reveal>
        <div className="menu-header">
          <h2 className="section-title">
            Commandez
            <br />
            comme vous
            <br />
            préférez.
          </h2>
          <p className="menu-intro">
            Le plus simple reste de nous appeler : votre commande est prête
            en quelques minutes, à emporter ou sur place. La livraison, elle,
            passe par nos partenaires.
          </p>
        </div>

        <div className="services-grid" ref={gridRef}>
          {/* Tuile principale : le téléphone (l'équivalent du King Drive chez BK). */}
          <a href={LINKS.phoneHref} className="services-tile services-tile--main" data-cursor-hover>
            <div className="services-tile-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className="services-tile-body">
              <span className="services-tile-eyebrow">Le plus rapide</span>
              <h3 className="services-tile-title">
                Commander
                <br />
                par téléphone
              </h3>
              <p className="services-tile-text">
                Appelez, commandez, c&apos;est prêt. À emporter ou à déguster
                sur place, sans file d&apos;attente.
              </p>
              <span className="services-tile-cta">
                {LINKS.phone} <span className="btn-arrow">→</span>
              </span>
            </div>
          </a>

          {/* Tuile Uber Eats (équiv. King Delivery). */}
          <a
            href={LINKS.uberEats}
            target="_blank"
            rel="noreferrer"
            className="services-tile services-tile--uber"
            data-cursor-hover
          >
            <div className="services-tile-logo">
              <UberEatsLogo className="services-brand-logo" />
            </div>
            <div className="services-tile-body">
              <span className="services-tile-eyebrow">Livraison</span>
              <h3 className="services-tile-title">Uber Eats</h3>
              <p className="services-tile-text">
                Vos plats préférés livrés chez vous, quand vous voulez.
              </p>
              <span className="services-tile-cta">
                Commander <span className="btn-arrow">→</span>
              </span>
            </div>
          </a>

          {/* Tuile Deliveroo (équiv. King Delivery). */}
          <a
            href={LINKS.deliveroo}
            target="_blank"
            rel="noreferrer"
            className="services-tile services-tile--deliveroo"
            data-cursor-hover
          >
            <div className="services-tile-logo">
              <DeliverooLogo className="services-brand-logo" />
            </div>
            <div className="services-tile-body">
              <span className="services-tile-eyebrow">Livraison</span>
              <h3 className="services-tile-title">Deliveroo</h3>
              <p className="services-tile-text">
                La même carte, livrée chaud par nos coursiers partenaires.
              </p>
              <span className="services-tile-cta">
                Commander <span className="btn-arrow">→</span>
              </span>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
