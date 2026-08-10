'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { LINKS } from '@/lib/links';
import { UberEatsLogo, DeliverooLogo } from './BrandLogos';

// Image de fond du hero, servie de façon responsive via <picture> :
//  - mobile  (<= 767px) : hero-mobile.webp  (~800px,  10 KB)
//  - desktop (>= 768px) : hero-desktop.webp (~1600px, 30 KB)
// Variantes WebP générées depuis la source 1920×1080 pour économiser la bande passante.
const HERO_IMG_MOBILE = '/hero-mobile.webp';
const HERO_IMG_DESKTOP = '/hero-desktop.webp';

export function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (bgRef.current) {
        // Simple fondu : pas de zoom, l'image reste visible en entier.
        gsap.from(bgRef.current, {
          opacity: 0,
          duration: 1.4,
          ease: 'expo.out',
        });
      }
      if (titleRef.current) {
        gsap.to(titleRef.current.querySelectorAll('.line > span'), {
          y: 0,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.12,
          delay: 0.3,
        });
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" id="hero">
      <div className="hero-bg" ref={bgRef}>
        <picture>
          {/* Bureau — écrans >= 768px : image haute définition (~1600px) */}
          <source media="(min-width: 768px)" srcSet={HERO_IMG_DESKTOP} />
          {/* Mobile — écrans <= 767px : image optimisée (~800px) */}
          <img
            src={HERO_IMG_MOBILE}
            alt="Burger maison O'Snack préparé minute avec des produits frais"
            className="hero-bg-img"
            loading="lazy"
          />
        </picture>
      </div>
      <div className="hero-overlay"></div>

      <div className="hero-content">
        <div className="hero-eyebrow">Sandwichs au four · Burgers maison · Torcy</div>
        <h1 className="hero-title" ref={titleRef}>
          <span className="line"><span>O&apos;SNACK</span></span>
          <span className="line"><span>TORCY</span></span>
        </h1>
        <p className="hero-subtitle">
          Préparé minute. Dévoré en un instant.
        </p>
        <div className="hero-rule" aria-hidden />
        <p className="hero-desc">
          Produits frais sélectionnés chaque matin, pains dorés au four, viandes
          savoureuses et sauces maison. Une qualité honnête, des portions
          généreuses — le goût du vrai, sans aucun compromis.
        </p>
        <div className="hero-ctas">
          <a
            href={LINKS.phoneHref}
            className="order-btn order-btn--phone"
            data-cursor-hover
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="order-btn-logo">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Appeler · {LINKS.phone}</span>
            <span className="btn-arrow">→</span>
          </a>
          <a
            href={LINKS.uberEats}
            target="_blank"
            rel="noreferrer"
            className="order-btn order-btn--uber"
            data-cursor-hover
          >
            <UberEatsLogo className="order-btn-logo" />
            <span>Uber Eats</span>
            <span className="btn-arrow">→</span>
          </a>
          <a
            href={LINKS.deliveroo}
            target="_blank"
            rel="noreferrer"
            className="order-btn order-btn--deliveroo"
            data-cursor-hover
          >
            <DeliverooLogo className="order-btn-logo" />
            <span>Deliveroo</span>
            <span className="btn-arrow">→</span>
          </a>
          <Link href="/carte" className="btn" data-cursor-hover>
            Voir la carte <span className="btn-arrow">→</span>
          </Link>
        </div>
      </div>

      <div className="hero-meta">
        <strong>OUVERT 7J/7</strong>
        <br />
        11h30 — 14h30
        <br />
        18h00 — 01h00
      </div>

      <div className="hero-scroll">
        <span className="line-vert"></span>
        Scroll
      </div>
    </section>
  );
}
