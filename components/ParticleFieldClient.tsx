'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

/**
 * Client wrapper so the three.js particle field is only loaded in the browser.
 * `next/dynamic` with `ssr: false` is not permitted inside a Server Component,
 * hence this thin client boundary.
 *
 * CWV : le champ de particules est purement décoratif — on attend l'idle du
 * navigateur avant de charger le bundle three.js, pour ne jamais concurrencer
 * le rendu critique (LCP) ni l'interactivité (INP).
 */
const ParticleField = dynamic(
  () => import('./ParticleField').then((m) => m.ParticleField),
  { ssr: false },
);

export function ParticleFieldClient() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supportsIdle = 'requestIdleCallback' in window;
    const id = supportsIdle
      ? requestIdleCallback(() => setReady(true), { timeout: 2500 })
      : window.setTimeout(() => setReady(true), 400);
    return () => {
      if (supportsIdle) cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);

  return ready ? <ParticleField /> : null;
}
