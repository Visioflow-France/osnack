'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setLenisInstance, resetScrollLock } from '@/lib/scrollLock';

/**
 * Sets up Lenis smooth scroll and wires it into the GSAP ticker so that
 * ScrollTrigger animations stay in sync. Disabled when the user prefers
 * reduced motion.
 *
 * En bonus : intercepte les clics sur les liens d'ancrage internes
 * (`<a href="#section">`) pour défiler rapidement jusqu'à la cible — un
 * défilement vif mais pas instantané, plutôt que la longue animation de
 * défilement fluide par défaut.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  // Filet de sécurité anti-page-figée : à chaque changement de page, on
  // réinitialise le verrou de scroll. Même si un déverrouillage s'était
  // perdu (état désynchronisé), la navigation rend toujours le scroll.
  const pathname = usePathname();
  useEffect(() => {
    resetScrollLock();
  }, [pathname]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.registerPlugin(ScrollTrigger);
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    // Partagé avec lib/scrollLock : permet aux modales de stopper/relancer
    // Lenis quand elles verrouillent le scroll de la page.
    setLenisInstance(lenis);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Défilement rapide vers les ancres internes (#section).
    // Offset négatif pour ne pas masquer le titre sous la nav flottante.
    const onAnchorClick = (e: MouseEvent) => {
      // Ignorer les clics avec touche modificatrice (ouverture nouvel onglet, etc.).
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.length < 2 || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, {
        offset: -80,
        duration: 0.6,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      });
    };
    document.addEventListener('click', onAnchorClick);

    return () => {
      document.removeEventListener('click', onAnchorClick);
      gsap.ticker.remove(onTick);
      setLenisInstance(null);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
