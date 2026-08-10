'use client';

import { StarRating } from './StarRating';
import { Reveal } from './Reveal';
import { GoogleGLogo } from './BrandLogos';
import { LINKS } from '@/lib/links';
import type { GoogleReviewsData } from '@/lib/google-reviews';

const STAR_PATH =
  'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';

/** Étoiles blanches pour l'en-tête (fond sombre). */
function ScoreStars({ rating }: { rating: number }) {
  return (
    <div className="stars" aria-label={`Note ${rating.toFixed(1)} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const isHalf = rating >= i - 0.5 && rating < i;
        const isFull = rating >= i;
        const fill = isHalf
          ? 'url(#half-fill)'
          : isFull
            ? '#fff'
            : 'rgba(255,255,255,0.2)';
        return (
          <svg key={i} viewBox="0 0 24 24" width={18} height={18}>
            <path d={STAR_PATH} fill={fill} />
          </svg>
        );
      })}
    </div>
  );
}

interface ReviewsProps {
  /** Vrais avis Google récupérés côté serveur. `null` = non configuré / erreur. */
  data: GoogleReviewsData | null;
}

export function Reviews({ data }: ReviewsProps) {
  const hasData = Boolean(data && data.reviews.length > 0);
  const googleUrl = data?.url ?? LINKS.addressQuery;

  return (
    <section className="reviews section-pad" id="reviews">
      <div className="container">
        <Reveal className="section-label" as="div">Espace Avis</Reveal>

        <div className="reviews-header">
          <div>
            <h2 className="section-title">
              Ils en
              <br />
              parlent mieux
              <br />
              que nous.
            </h2>
          </div>
          <div className="reviews-score">
            {hasData ? (
              <>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span className="big">{data!.rating.toFixed(1)}</span>
                    <span className="of">/ 5</span>
                  </div>
                  <ScoreStars rating={data!.rating} />
                </div>
                <div className="reviews-meta">
                  Basé sur <strong>{data!.total} avis Google</strong>
                  <br />
                  <span className="reviews-meta-google">
                    <GoogleGLogo className="reviews-google-logo" />
                    Avis collectés sur Google
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="big">Avis Google</span>
                </div>
                <div className="reviews-meta">
                  Les avis de nos clients sont en cours de synchronisation.
                  <br />
                  <span className="reviews-meta-google">
                    <GoogleGLogo className="reviews-google-logo" />
                    Retrouvez-les directement sur Google.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {hasData ? (
          <div className="reviews-grid" id="reviewsGrid">
            {data!.reviews.map((review) => (
              <Reveal className="" key={review.id} as="div">
                <article className="review-card">
                  <div className="review-top">
                    <StarRating rating={review.rating} />
                    <GoogleGLogo className="review-google-logo" />
                  </div>
                  <p className="review-text">{review.text}</p>
                  <div className="review-author">
                    {review.photoUri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="review-avatar review-avatar-img"
                        src={review.photoUri}
                        alt=""
                        width={40}
                        height={40}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="review-avatar">{review.name.charAt(0)}</div>
                    )}
                    <div>
                      <div className="review-name">{review.name}</div>
                      <div className="review-date">
                        Avis Google{review.date ? ` · ${review.date}` : ''}
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="reviews-empty">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="reviews-empty-cta"
              data-cursor-hover
            >
              <GoogleGLogo className="reviews-google-logo" />
              Voir les avis sur Google
            </a>
          </div>
        )}

        {hasData && (
          <div className="reviews-footer">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover
            >
              Voir tous les avis sur Google →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
