'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Filter } from '@/lib/menu';

/**
 * ── Bandeau de tuiles de la carte (organisation Burger King) ─────────────────
 *
 * Rangée horizontale de filtres visuels : tuiles carrées arrondies (photo
 * plein cadre, anneau orange sur la tuile active), libellé dessous et nombre
 * de plats en pastille. Défilable au doigt sur mobile (scroll-snap, barre
 * masquée) et à la molette/trackpad sur desktop. La tuile active est
 * automatiquement recentrée dans le bandeau (sans toucher au défilement
 * vertical de la page).
 */

export interface BubbleItem {
  /** Filtre de la carte ciblé par la bulle. */
  id: Filter;
  /** Libellé affiché sous la bulle. */
  label: string;
  /** Nombre de plats du filtre (pastille). */
  count: number;
  /** Photo de couverture de la bulle (image du 1er plat du filtre). */
  image: string;
}

interface Props {
  items: BubbleItem[];
  active: Filter;
  onChange: (filter: Filter) => void;
}

export function CategoryBubbles({ items, active, onChange }: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  // Recentre la bulle active dans le bandeau quand le filtre change
  // (clic OU lien `/carte?cat=…`). Scroll horizontal uniquement : on calcule
  // l'offset à la main pour ne jamais déplacer la page verticalement.
  useEffect(() => {
    const box = scroller.current;
    const el = box?.querySelector<HTMLElement>(`[data-bubble="${active}"]`);
    if (!box || !el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({
      left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [active]);

  return (
    <div
      className="carte-bubbles"
      role="tablist"
      aria-label="Filtrer la carte par catégorie"
      ref={scroller}
    >
      {items.map((b) => {
        const isActive = b.id === active;
        return (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-bubble={b.id}
            className={`bubble ${isActive ? 'active' : ''}`}
            onClick={() => onChange(b.id)}
          >
            <span className="bubble-img">
              <Image src={b.image} alt="" fill sizes="128px" />
              <span className="bubble-count">{b.count}</span>
            </span>
            <span className="bubble-label">{b.label}</span>
          </button>
        );
      })}
    </div>
  );
}
