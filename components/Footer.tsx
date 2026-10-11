'use client';

import Link from 'next/link';
import { LINKS } from '@/lib/links';
import { useSiteLinks } from '@/lib/useSiteLinks';
import { UberEatsLogo, DeliverooLogo } from './BrandLogos';
import { SocialFollow } from './SocialFollow';

export function Footer() {
  // Réseaux + plateformes : éditables dans l'admin (défauts lib/links.ts).
  const { links } = useSiteLinks();

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
            Snack et fast food à Torcy : sandwichs au four, burgers gourmands et
            crêpes maison. Restauration rapide à emporter, sur place ou en
            livraison, au cœur de Torcy — 7 jours sur 7.
          </p>
          <div className="footer-social">
            <a href={links.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" data-cursor-hover>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
            <a href={links.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" data-cursor-hover>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
            <a href={links.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" data-cursor-hover>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
            <a href={links.twitter} target="_blank" rel="noreferrer" aria-label="Twitter / X" data-cursor-hover>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href={links.snapchat} target="_blank" rel="noreferrer" aria-label="Snapchat" data-cursor-hover>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" />
              </svg>
            </a>
          </div>
          <div className="footer-order">
            <span className="footer-order-label">Commander en ligne</span>
            <div className="footer-order-row">
              <a
                href={links.uberEats}
                target="_blank"
                rel="noreferrer"
                className="footer-order-btn footer-order-btn--uber"
                aria-label="Commander sur Uber Eats"
                data-cursor-hover
              >
                <UberEatsLogo className="footer-order-logo" />
              </a>
              <a
                href={links.deliveroo}
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
          <h2 className="footer-col-title">Contact &amp; localisation à Torcy</h2>
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
                77200 Torcy
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
          <h2 className="footer-col-title">Horaires d'ouverture</h2>
          <div className="hours-line"><span className="day">Lun — Dim</span><span className="time">7j/7</span></div>
          <div className="hours-line"><span className="day">Midi</span><span className="time">11h30 — 14h30</span></div>
          <div className="hours-line"><span className="day">Soir</span><span className="time">18h00 — 01h00</span></div>
          <div className="hours-line closed"><span className="day">Drive</span><span className="time">Sur place</span></div>
        </div>

        <div className="footer-col">
          <h2 className="footer-col-title">Navigation</h2>
          <ul>
            <li><Link href="/#story" data-cursor-hover>Le Concept</Link></li>
            <li><Link href="/carte" data-cursor-hover>La Carte</Link></li>
            <li><Link href="/carte" data-cursor-hover>Commander en ligne</Link></li>
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

      <SocialFollow />

      <div className="footer-huge">O&apos;SNACK</div>

      <div className="footer-bottom">
        <div>© 2026 O&apos;Snack Torcy — Tous droits réservés</div>
        {/* flex-wrap nécessaire : sans lui, la rangée de liens légaux fait
            ~330 px de large et déborde de l'écran sur les mobiles ≤ 320 px. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
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
