'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { useCart } from '../CartContext';

/**
 * Barre panier flottante, rendue sur /carte dès qu'un article est ajouté.
 * Retour visuel immédiat après « Ajouter » + accès direct au checkout.
 */
export function CartBar() {
  const { ready, count, total } = useCart();
  if (!ready || count === 0) return null;

  return (
    <Link href="/commander" className="cart-bar" data-cursor-hover>
      <span className="cart-bar-count">
        {count} article{count > 1 ? 's' : ''}
      </span>
      <span className="cart-bar-total">{formatPrice(total)}</span>
      <span className="cart-bar-cta">
        Voir ma commande
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </Link>
  );
}
