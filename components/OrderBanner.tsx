'use client';

import Link from 'next/link';
import { LINKS } from '@/lib/links';
import { Reveal } from './Reveal';
import { UberEatsLogo, DeliverooLogo } from './BrandLogos';

/**
 * Bloc de fin de page — l'équivalent du bloc app mobile chez BK, décliné pour
 * O'Snack : un grand bandeau « Commandez en quelques minutes » avec les trois
 * canaux (téléphone, Uber Eats, Deliveroo) et la liste des avantages.
 */
export function OrderBanner() {
  return (
    <section className="order-banner" id="order">
      <div className="container">
        <Reveal className="order-banner-inner">
          <div className="order-banner-head">
            <Reveal className="section-label section-label--light" as="div">
              Commander
            </Reveal>
            <h2 className="order-banner-title">
              Une petite faim&nbsp;?
              <br />
              <span className="accent">Résolue en quelques minutes.</span>
            </h2>
            <p className="order-banner-text">
              Appelez-nous, c&apos;est prêt quand vous arrivez. Ou faites-vous
              livrer par nos partenaires — la carte est la même, la générosité
              aussi.
            </p>
          </div>

          <div className="order-banner-ctas">
            <a
              href={LINKS.phoneHref}
              className="order-btn order-btn--phone order-banner-btn"
              data-cursor-hover
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="order-btn-logo">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Appeler · {LINKS.phone}</span>
              <span className="btn-arrow">→</span>
            </a>
            <a
              href={LINKS.uberEats}
              target="_blank"
              rel="noreferrer"
              className="order-btn order-btn--uber order-banner-btn"
              data-cursor-hover
            >
              <UberEatsLogo className="order-btn-logo" />
              <span>Uber Eats</span>
              <span className="btn-arrow">→</span>
            </a>
            <a
              href={LINKS.deliveroo}
              target="_blank"
              rel="noreferrer"
              className="order-btn order-btn--deliveroo order-banner-btn"
              data-cursor-hover
            >
              <DeliverooLogo className="order-btn-logo" />
              <span>Deliveroo</span>
              <span className="btn-arrow">→</span>
            </a>
            <Link href="/carte" className="btn order-banner-btn order-banner-btn--ghost" data-cursor-hover>
              Consulter la carte <span className="btn-arrow">→</span>
            </Link>
          </div>

          <ul className="order-banner-perks">
            <li>Vos plats préparés minute, à emporter ou sur place</li>
            <li>Ouvert 7j/7 — 11h30 à 14h30, 18h00 à 01h00</li>
            <li>La même carte sur Uber Eats et Deliveroo</li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
