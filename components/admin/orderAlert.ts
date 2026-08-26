'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Order } from '@/lib/products';

/**
 * Alerte « nouvelle commande WEB » pour le dashboard :
 * - bip Web Audio (aucun asset audio) — l'AudioContext est déverrouillé au
 *   premier clic de l'admin sur la page (politique autoplay des navigateurs) ;
 * - bandeau non intrusif + pulsation du titre de l'onglet jusqu'à acquittement.
 * Le premier snapshot n'alerte pas (initialisation silencieuse au chargement).
 */

export interface OrderAlert {
  /** Commandes web nouvelles non acquittées (plus récentes d'abord). */
  pending: Order[];
  /** Acquitter une commande (bouton « Vu »). */
  ack: (id: string) => void;
}

export function useOrderAlert(orders: Order[] | null): OrderAlert {
  const seen = useRef<Set<string> | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const [pending, setPending] = useState<Order[]>([]);

  /* Déverrouillage audio au premier geste (listener once, posé au montage). */
  useEffect(() => {
    const unlock = () => {
      try {
        if (!audioCtx.current) {
          const w = window as unknown as {
            AudioContext?: typeof AudioContext;
            webkitAudioContext?: typeof AudioContext;
          };
          const Ctor = w.AudioContext ?? w.webkitAudioContext;
          if (Ctor) audioCtx.current = new Ctor();
        }
        void audioCtx.current?.resume();
      } catch {
        /* pas d'audio disponible : l'alerte restera visuelle */
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  /* Détection des nouvelles commandes web. */
  useEffect(() => {
    if (!orders) return;
    if (seen.current === null) {
      seen.current = new Set(orders.map((o) => o.id)); // snapshot initial silencieux
      return;
    }
    const fresh = orders.filter(
      (o) => !seen.current!.has(o.id) && o.channel === 'web' && o.status === 'nouvelle',
    );
    for (const o of orders) seen.current.add(o.id);
    if (fresh.length > 0) {
      beep(audioCtx.current);
      setPending((prev) => [...fresh, ...prev].slice(0, 5));
    }
  }, [orders]);

  /* Titre d'onglet pulsé tant qu'une alerte attend son acquittement. */
  useEffect(() => {
    if (pending.length === 0) return;
    const original = document.title;
    let on = false;
    const timer = window.setInterval(() => {
      on = !on;
      document.title = on
        ? `(${pending.length}) Nouvelle commande — Admin`
        : original;
    }, 1000);
    return () => {
      window.clearInterval(timer);
      document.title = original;
    };
  }, [pending.length]);

  const ack = useCallback((id: string) => {
    setPending((prev) => prev.filter((o) => o.id !== id));
  }, []);

  return { pending, ack };
}

/** Deux notes courtes (880 / 1200 Hz), volume modéré, enveloppe exponentielle. */
function beep(ctx: AudioContext | null) {
  if (!ctx || ctx.state !== 'running') return; // encore verrouillé → visuel seul
  try {
    const t0 = ctx.currentTime;
    const notes: [number, number][] = [
      [880, 0],
      [1200, 0.18],
    ];
    for (const [freq, start] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + start);
      gain.gain.exponentialRampToValueAtTime(0.12, t0 + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + 0.16);
    }
  } catch {
    /* silencieux */
  }
}
