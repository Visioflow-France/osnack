'use client';

import { useEffect } from 'react';

/* Enregistre le service worker du dashboard (scope /admin/).
 * L'en-tête Service-Worker-Allowed est requis car le script est servi
 * depuis /sw.admin.js — cf. next.config.mjs. */
export function AdminSWRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker
        .register('/sw.admin.js', { scope: '/admin/' })
        .catch(() => {
          /* échec silencieux : le dashboard reste utilisable en ligne */
        });
    };
    if (document.readyState === 'complete') register();
    else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
