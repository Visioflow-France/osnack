'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSlides } from '@/lib/useSlides';
import { Reveal } from './Reveal';

/**
 * Carrousel des grandes catégories de la carte (remplace « Découvrez nos
 * classiques ») : une image à la fois, navigable par flèches / pastilles /
 * swipe. Titre et image de chaque slide sont éditables dans le dashboard
 * admin (Firestore `home_slides`) ; le bouton « Découvrir » amène à la
 * section correspondante de la carte via `/carte?cat=…`.
 * Réutilise les styles `.news-*` du carrousel d'actu (primitives visuelles
 * partagées) ; `.cat-*` cadre le tout dans la section.
 */
export function CategoryCarousel() {
  const { slides } = useSlides();
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

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
    <section className="cat-carousel section-pad" id="categories">
      <div className="container">
        <Reveal className="section-label" as="div">Notre Carte</Reveal>

        <div className="menu-header">
          <h2 className="section-title">
            Explorez
            <br />
            la carte.
          </h2>
          <p className="menu-intro">
            Sandwichs au four, burgers généreux, tex-mex à partager, crêpes
            maison, desserts et milkshakes — chaque catégorie a sa gourmandise.
          </p>
        </div>
      </div>

      <div
        className="container cat-frame"
        aria-roledescription="carrousel"
        aria-label="Les catégories de la carte"
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        tabIndex={-1}
      >
        <div className="news-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((slide, i) => (
            <article
              key={slide.id}
              className="news-slide news-slide--dark"
              aria-hidden={i !== index}
              aria-roledescription="slide"
              aria-label={`${i + 1} sur ${count}`}
            >
              <div className="news-slide-bg">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 768px) 100vw, 1400px"
                />
              </div>
              <div className="news-slide-content">
                <h3 className="news-slide-title">{slide.title}</h3>
                <Link
                  href={`/carte?cat=${slide.id}`}
                  className="news-slide-cta"
                  data-cursor-hover
                >
                  Découvrir <span className="btn-arrow">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="news-controls">
          <button
            className="news-arrow"
            onClick={() => go(-1)}
            aria-label="Catégorie précédente"
            data-cursor-hover
          >
            ←
          </button>
          <div className="news-dots" role="tablist" aria-label="Choisir une catégorie">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                role="tab"
                aria-selected={i === index}
                aria-label={`Catégorie ${i + 1} : ${slide.title}`}
                className={`news-dot ${i === index ? 'active' : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button
            className="news-arrow"
            onClick={() => go(1)}
            aria-label="Catégorie suivante"
            data-cursor-hover
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
