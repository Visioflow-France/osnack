'use client';

import { useEffect } from 'react';
import type Lenis from 'lenis';

/**
 * ── Verrou de scroll partagé (fix du blocage mobile) ─────────────────────────
 *
 * L'ancien verrou posait `overflow: hidden` sur <body> uniquement : sur iOS le
 * déverrouillage pouvait se perdre et laisser la page figée. Ce verrou :
 *   1. stoppe aussi Lenis (sinon la boucle raf continue de piloter le scroll) ;
 *   2. verrouille <html> (fiable sur iOS 13+, contrairement à <body> seul) ;
 *   3. compte les verrous posés : des modales empilées ne se marchent plus
 *      dessus, et le scroll n'est rendu qu'au déblocage du dernier verrou.
 */

/** Instance Lenis active (null si prefers-reduced-motion). */
let lenisInstance: Lenis | null = null;

/** Enregistré par SmoothScrollProvider, lu par lockScroll/unlockScroll. */
export function setLenisInstance(l: Lenis | null): void {
  lenisInstance = l;
}

/** Nombre de verrous actuellement posés (0 = page scrollable). */
let locks = 0;

export function lockScroll(): void {
  locks += 1;
  if (locks > 1) return; // déjà verrouillé par une autre modale
  lenisInstance?.stop();
  document.documentElement.style.overflow = 'hidden';
}

export function unlockScroll(): void {
  if (locks === 0) return;
  locks -= 1;
  if (locks > 0) return; // une autre modale garde le verrou
  document.documentElement.style.overflow = '';
  lenisInstance?.start();
}

/** Pose un verrou pour la durée de vie du composant appelant. */
export function useScrollLock(): void {
  useEffect(() => {
    lockScroll();
    return unlockScroll;
  }, []);
}
