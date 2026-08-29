'use client';

import { useEffect, useRef } from 'react';
import type { Filter } from '@/lib/menu';

/**
 * ── Rangée de noms de catégories (haut de la carte) ──────────────────────────
 *
 * Bandeau collant texte seul : un nom par catégorie, la catégorie active
 * marquée d'un trait orange. Défilable au doigt sur mobile (scroll-snap,
 * barre masquée) et à la molette/trackpad sur desktop. Le nom actif est
 * automatiquement recentré dans la rangée (sans toucher au défilement
 * vertical de la page).
 */

interface NameItem {
  /** Filtre de la carte ciblé par le nom. */
  id: Filter;
  /** Libellé affiché. */
  label: string;
}

interface Props {
  items: NameItem[];
  active: Filter;
  onChange: (filter: Filter) => void;
}

export function CategoryNames({ items, active, onChange }: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  // Recentre le nom actif dans la rangée quand le filtre change (clic tuile,
  // clic nom OU lien `/carte?cat=…`). Scroll horizontal uniquement : on
  // calcule l'offset à la main pour ne jamais déplacer la page verticalement.
  useEffect(() => {
    const box = scroller.current;
    const el = box?.querySelector<HTMLElement>(`[data-name="${active}"]`);
    if (!box || !el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({
      left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [active]);

  return (
    <div
      className="carte-names"
      role="tablist"
      aria-label="Filtrer la carte par catégorie"
      ref={scroller}
    >
      {items.map((n) => {
        const isActive = n.id === active;
        return (
          <button
            key={n.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-name={n.id}
            className={`cname ${isActive ? 'active' : ''}`}
            onClick={() => onChange(n.id)}
          >
            {n.label}
          </button>
        );
      })}
    </div>
  );
}
