'use client';

import Link from 'next/link';
import { useAuth } from './AuthContext';
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

      <a
        href={LINKS.phoneHref}
        className="floating-nav-phone"
        data-cursor-hover
        aria-label={`Commander — appeler ${LINKS.phone}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <span>Commander</span>
      </a>
    </nav>
  );
}
