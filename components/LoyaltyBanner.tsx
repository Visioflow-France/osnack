'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './AuthContext';
import { GIFT_TIERS, giftProduct } from '@/lib/loyalty';
import { Reveal } from './Reveal';

/**
 * Bannière fidélité — gabarit exact du bloc BK « Profitez d'offres
 * exclusives » (visuel à gauche, titre + description + CTA à droite, fond
 * plein) : image du téléphone de l'app est remplacée par un visuel de
 * fidelité (carte + points), et les badges de téléchargement par les
 * paliers cadeaux. Si le client est connecté, son solde remplace le CTA
 * d'inscription.
 */
export function LoyaltyBanner() {
  const { user, profile } = useAuth();
  const firstTier = GIFT_TIERS[0];
  const firstGift = giftProduct(firstTier);

  return (
    <section className="loyalty section-pad" id="fidelite">
      <div className="container loyalty-inner">
        {/* Visuel — l'équivalent du mock téléphone chez BK. */}
        <Reveal className="loyalty-visual" as="div">
          <div className="loyalty-card-stack">
            <div className="loyalty-stamp-card">
              <div className="loyalty-stamp-head">
                <span className="loyalty-stamp-brand">O&apos;SNACK</span>
                <span className="loyalty-stamp-label">Fidélité</span>
              </div>
              <div className="loyalty-stamp-points">
                {user ? (profile?.points ?? 0) : 250}
                <small>pts</small>
              </div>
              <div className="loyalty-stamp-progress" aria-hidden>
                <span style={{ width: user ? `${Math.min(100, ((profile?.points ?? 0) / 250) * 100)}%` : '100%' }} />
              </div>
              <div className="loyalty-stamp-foot">
                1 € dépensé = 1 point
              </div>
            </div>
            <div className="loyalty-photo">
              <Image
                src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80"
                alt="Burger et frites servis sur le comptoir O'Snack"
                fill
                sizes="(max-width: 768px) 100vw, 480px"
              />
            </div>
          </div>
        </Reveal>

        {/* Texte + CTA — l'équivalent du bloc titre/badges chez BK. */}
        <Reveal className="loyalty-content" as="div">
          <Reveal className="section-label" as="div">Fidélité</Reveal>
          <h2 className="loyalty-title">
            Gagnez des points,
            <br />
            garnissez vos cadeaux.
          </h2>
          <p className="loyalty-text">
            Chaque euro dépensé vous rapporte un point. À chaque palier
            atteint, un cadeau de la carte vous attend — offert, au comptoir
            comme en livraison.
          </p>

          {/* Paliers — l'équivalent des badges store chez BK. */}
          <ul className="loyalty-tiers">
            {GIFT_TIERS.map((tier) => {
              const gift = giftProduct(tier);
              return (
                <li key={tier.threshold}>
                  <span className="loyalty-tier-pts">{tier.threshold} pts</span>
                  <span className="loyalty-tier-gift">
                    {gift ? `${gift.name}${gift.desc ? ` · ${gift.desc}` : ''}` : tier.label}
                  </span>
                </li>
              );
            })}
          </ul>

          {user ? (
            <div className="loyalty-cta loyalty-cta--logged">
              <span className="loyalty-balance">
                <strong>{profile?.points ?? 0}</strong> points
              </span>
              <Link href="/compte" className="btn loyalty-btn" data-cursor-hover>
                Mon compte <span className="btn-arrow">→</span>
              </Link>
            </div>
          ) : (
            <div className="loyalty-cta">
              <Link href="/compte" className="btn loyalty-btn" data-cursor-hover>
                Créer mon compte <span className="btn-arrow">→</span>
              </Link>
              <span className="loyalty-cta-hint">
                Déjà inscrit&nbsp;?{' '}
                <Link href="/compte">Connectez-vous</Link>
              </span>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
