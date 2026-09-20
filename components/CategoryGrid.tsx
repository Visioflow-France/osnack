'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSlides } from '@/lib/useSlides';
import { Reveal } from './Reveal';

/**
 * Grille des grandes catégories de la carte (gabarit osnackparis.fr) :
 * toutes les bulles sont visibles d'un coup — 3 par ligne en desktop,
 * 2 sur mobile. Chaque bulle garde la forme du carrousel d'origine
 * (image plein cadre, dégradé sombre, titre + bouton « Découvrir ») ;
 * titre et image restent éditables dans le dashboard admin
 * (Firestore `home_slides`), le bouton amène à la section correspondante
 * de la carte via `/carte?cat=…`. Réutilise les styles `.news-*` du
 * carrousel d'actu (primitives visuelles partagées) ; `.cat-grid` cadre
 * le tout dans la section.
 */
export function CategoryGrid() {
  const { slides } = useSlides();

  return (
    <section className="cat-grid-section section-pad" id="categories">
      <div className="container">
        <Reveal className="section-label" as="div">Notre Carte</Reveal>

        <div className="menu-header">
          <h2 className="section-title">
            Explorez
            <br />
            la carte.
            <span className="sr-only">
              {' '}
              Burgers, sandwichs au four, crêpes et menus du snack O'Snack à
              Torcy
            </span>
          </h2>
        </div>
      </div>

      <div className="container">
        <div className="cat-grid" aria-label="Les catégories de la carte">
          {slides.map((slide) => (
            <Reveal key={slide.id} className="cat-cell">
              <article className="news-slide news-slide--dark">
                <div className="news-slide-bg">
                  <Image
                    src={slide.image}
                    alt={`${slide.title} — snack fast food O'Snack à Torcy`}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
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
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
