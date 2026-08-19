'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Équivalent du carrousel « L'actualité Burger King » : grandes bannières
// promo qui défilent en autoplay, navigables par flèches / pastilles / swipe.
const SLIDES = [
  {
    title: 'Sandwichs au four',
    subtitle: 'Pain doré, viande savoureuse, sauces maison',
    cta: 'Voir la carte',
    href: '/carte',
    image:
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1600&auto=format&fit=crop&q=80',
    alt: 'Sandwich au four freshly préparé',
    theme: 'light',
  },
  {
    title: 'Burgers gourmands',
    subtitle: 'Steaks bouchère 150 g, frites Steak House',
    cta: 'Voir la carte',
    href: '/carte',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1600&auto=format&fit=crop&q=80',
    alt: 'Burger gourmet avec frites',
    theme: 'dark',
  },
  {
    title: 'Menu Étudiant 7,50 €',
    subtitle: 'Grec + Cheese Burger + frites + boisson, 11h30 — 15h00',
    cta: 'Voir les menus',
    href: '/carte',
    image:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1600&auto=format&fit=crop&q=80',
    alt: 'Menu complet sandwich et burger',
    theme: 'light',
  },
];

const AUTOPLAY_MS = 5000;

export function NewsCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = SLIDES.length;

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

  // Autoplay, interrompu au survol / focus (accessibilité).
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, go]);

  // Navigation clavier gauche/droite quand le carrousel a le focus.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <section
      className="news-carousel"
      aria-roledescription="carrousel"
      aria-label="L'actualité O'Snack"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      tabIndex={-1}
    >
      <div className="news-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {SLIDES.map((slide, i) => (
          <article
            key={slide.title}
            className={`news-slide ${slide.theme === 'dark' ? 'news-slide--dark' : ''}`}
            aria-hidden={i !== index}
            aria-roledescription="slide"
            aria-label={`${i + 1} sur ${count}`}
          >
            <div className="news-slide-bg">
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={i === 0}
                sizes="100vw"
              />
            </div>
            <div className="news-slide-content">
              <h2 className="news-slide-title">{slide.title}</h2>
              <p className="news-slide-subtitle">{slide.subtitle}</p>
              {slide.href.startsWith('/') ? (
                <Link href={slide.href} className="news-slide-cta" data-cursor-hover>
                  {slide.cta} <span className="btn-arrow">→</span>
                </Link>
              ) : (
                <a
                  href={slide.href}
                  target="_blank"
                  rel="noreferrer"
                  className="news-slide-cta"
                  data-cursor-hover
                >
                  {slide.cta} <span className="btn-arrow">→</span>
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="news-controls">
        <button
          className="news-arrow"
          onClick={() => go(-1)}
          aria-label="Actualité précédente"
          data-cursor-hover
        >
          ←
        </button>
        <div className="news-dots" role="tablist" aria-label="Choisir une actualité">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.title}
              role="tab"
              aria-selected={i === index}
              aria-label={`Actualité ${i + 1} : ${slide.title}`}
              className={`news-dot ${i === index ? 'active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button
          className="news-arrow"
          onClick={() => go(1)}
          aria-label="Actualité suivante"
          data-cursor-hover
        >
          →
        </button>
      </div>
    </section>
  );
}
