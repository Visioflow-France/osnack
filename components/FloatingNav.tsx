'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { LINKS } from '@/lib/links';

// Barre de navigation flottante (pastille centrée, toujours visible au scroll).
// Identique sur mobile, tablette et ordinateur : seuls la taille et l'espacement
// s'adaptent, les liens restent toujours visibles.
// Sur mobile, les labels sont raccourcis (« Carte ») pour rester lisibles sur une
// seule ligne — voir la media query `.floating-nav` dans globals.css.
const NAV_ITEMS = [
  { name: 'Carte', link: '/carte' },
  { name: 'Histoire', link: '/histoire' },
];

export function FloatingNav() {
  const { user, profile } = useAuth();
  const { ready, count } = useCart();

  // Menu « Commander » : choix du canal (téléphone, site, sur place).
  const [orderOpen, setOrderOpen] = useState(false);
  const orderRef = useRef<HTMLDivElement>(null);

  // Fermeture du menu au clic extérieur ou à la touche Échap.
  useEffect(() => {
    if (!orderOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (orderRef.current && !orderRef.current.contains(e.target as Node)) {
        setOrderOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOrderOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [orderOpen]);

  return (
    <nav className="floating-nav" id="floating-nav" aria-label="Navigation principale">
      <Link href="/" className="floating-nav-brand" data-cursor-hover>
        O&apos;SNACK<span className="dot" aria-hidden />
      </Link>

      <ul className="floating-nav-links">
        {NAV_ITEMS.map((item) => (
          <li key={item.link}>
            <Link href={item.link} data-cursor-hover>
              {item.name}
            </Link>
          </li>
        ))}
        {/* Fidélité : solde si connecté, sinon simple accès au compte. */}
        <li>
          <Link
            href="/compte"
            data-cursor-hover
            className={user ? 'floating-nav-loyalty' : undefined}
            aria-label={
              user
                ? `Mon compte fidélité — ${profile?.points ?? 0} points`
                : 'Mon compte fidélité'
            }
          >
            {user ? `${profile?.points ?? 0} pts` : 'Compte'}
          </Link>
        </li>
      </ul>

      {/* Panier : n'apparaît qu'au premier article ajouté (largeur mobile préservée). */}
      {ready && count > 0 && (
        <Link
          href="/commander"
          className="floating-nav-cart"
          data-cursor-hover
          aria-label={`Voir ma commande — ${count} article${count > 1 ? 's' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="17" cy="20" r="1.4" />
            <path d="M3 3h2.2l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h7.6a1.6 1.6 0 0 0 1.6-1.3L20 7H5.4" />
          </svg>
          <span className="floating-nav-cart-badge">{count}</span>
        </Link>
      )}

      {/* « Commander » : ouvre un choix de canal plutôt que d'appeler directement. */}
      <div className="floating-nav-order" ref={orderRef}>
        <button
          type="button"
          className="floating-nav-phone"
          data-cursor-hover
          aria-haspopup="menu"
          aria-expanded={orderOpen}
          aria-label="Commander — choisir le mode de commande"
          onClick={() => setOrderOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>Commander</span>
        </button>

        {orderOpen && (
          <div className="floating-nav-order-menu" role="menu" aria-label="Modes de commande">
            <a
              role="menuitem"
              href={LINKS.phoneHref}
              className="floating-nav-order-item"
              data-cursor-hover
              onClick={() => setOrderOpen(false)}
            >
              <span className="floating-nav-order-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <span className="floating-nav-order-text">
                <span className="floating-nav-order-title">Par téléphone</span>
                <span className="floating-nav-order-sub">{LINKS.phone}</span>
              </span>
            </a>

            <Link
              role="menuitem"
              href="/commander"
              className="floating-nav-order-item"
              data-cursor-hover
              onClick={() => setOrderOpen(false)}
            >
              <span className="floating-nav-order-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="20" r="1.4" />
                  <circle cx="17" cy="20" r="1.4" />
                  <path d="M3 3h2.2l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h7.6a1.6 1.6 0 0 0 1.6-1.3L20 7H5.4" />
                </svg>
              </span>
              <span className="floating-nav-order-text">
                <span className="floating-nav-order-title">Sur le site</span>
                <span className="floating-nav-order-sub">Retrait ou livraison</span>
              </span>
            </Link>

            <a
              role="menuitem"
              href={LINKS.addressQuery}
              target="_blank"
              rel="noreferrer"
              className="floating-nav-order-item"
              data-cursor-hover
              onClick={() => setOrderOpen(false)}
            >
              <span className="floating-nav-order-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span className="floating-nav-order-text">
                <span className="floating-nav-order-title">Venir sur place</span>
                <span className="floating-nav-order-sub">{LINKS.address}</span>
              </span>
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
