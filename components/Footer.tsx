import Link from 'next/link';
import { LINKS } from '@/lib/links';
import { UberEatsLogo, DeliverooLogo } from './BrandLogos';

export function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="logo">
            O&apos;SNACK
            <br />
            TORCY
          </div>
          <p className="tagline">
            Sandwichs au four &amp; burgers gourmands. Le goût authentique au cœur de
            Torcy, 7 jours sur 7.
          </p>
          <div className="footer-social">
            <a href={LINKS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" data-cursor-hover>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
            <a href={LINKS.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" data-cursor-hover>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
          </div>
          <div className="footer-order">
            <span className="footer-order-label">Commander en ligne</span>
            <div className="footer-order-row">
              <a
                href={LINKS.uberEats}
                target="_blank"
                rel="noreferrer"
                className="footer-order-btn footer-order-btn--uber"
                aria-label="Commander sur Uber Eats"
                data-cursor-hover
              >
                <UberEatsLogo className="footer-order-logo" />
              </a>
              <a
                href={LINKS.deliveroo}
                target="_blank"
                rel="noreferrer"
                className="footer-order-btn footer-order-btn--deliveroo"
                aria-label="Commander sur Deliveroo"
                data-cursor-hover
              >
                <DeliverooLogo className="footer-order-logo" />
                <span>Deliveroo</span>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li>
              <a
                href={LINKS.addressQuery}
                target="_blank"
                rel="noreferrer"
                data-cursor-hover
              >
                57 Rue de Paris
                <br />
                77220 Torcy
              </a>
            </li>
            <li>
              <a href={LINKS.phoneHref} data-cursor-hover>09 88 08 61 25</a>
            </li>
            <li>
              <a
                href={LINKS.addressQuery}
                target="_blank"
                rel="noreferrer"
                className="footer-map-link"
                data-cursor-hover
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Itinéraire Maps
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Horaires</h4>
          <div className="hours-line"><span className="day">Lun — Dim</span><span className="time">7j/7</span></div>
          <div className="hours-line"><span className="day">Midi</span><span className="time">11h30 — 14h30</span></div>
          <div className="hours-line"><span className="day">Soir</span><span className="time">18h00 — 01h00</span></div>
          <div className="hours-line closed"><span className="day">Drive</span><span className="time">Sur place</span></div>
        </div>

        <div className="footer-col">
          <h4>Navigation</h4>
          <ul>
            <li><Link href="/#story" data-cursor-hover>Le Concept</Link></li>
            <li><Link href="/carte" data-cursor-hover>La Carte</Link></li>
            <li><Link href="/commander" data-cursor-hover>Commander en ligne</Link></li>
            <li><Link href="/histoire" data-cursor-hover>Histoire</Link></li>
            <li><Link href="/#reviews" data-cursor-hover>Avis Clients</Link></li>
            <li><Link href="/#contact" data-cursor-hover>Nous Trouver</Link></li>
            <li><Link href="/compte" data-cursor-hover>Mon compte fidélité</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-map">
        <iframe
          title="Localisation d'O'Snack Torcy sur Google Maps"
          src={LINKS.mapsEmbed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      <div className="footer-huge">O&apos;SNACK</div>

      <div className="footer-bottom">
        <div>© 2025 O&apos;Snack Torcy — Tous droits réservés</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/mentions-legales" data-cursor-hover>Mentions légales</Link>
          <Link href="/cgv" data-cursor-hover>CGV</Link>
          <Link href="/confidentialite" data-cursor-hover>Confidentialité</Link>
          <Link href="/cookies" data-cursor-hover>Cookies</Link>
        </div>
      </div>

      <div className="footer-credit">
        <a
          href="https://visioflow.fr"
          target="_blank"
          rel="noreferrer"
          data-cursor-hover
        >
          Site réalisé par <strong>visioflow.fr</strong>
        </a>
      </div>
    </footer>
  );
}
