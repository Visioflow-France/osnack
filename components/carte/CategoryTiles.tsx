'use client';

import Image from 'next/image';
import type { Filter } from '@/lib/menu';

/**
 * ── Grosses tuiles de catégories (bas de la carte) ───────────────────────────
 *
 * Grille de navigation visuelle : 2 tuiles par ligne sur mobile, 4 sur
 * desktop. Chaque tuile = photo plein cadre + libellé + nombre de plats ;
 * la catégorie active porte un anneau orange. Le clic (géré par Menu.tsx)
 * change de catégorie et ramène à la grille de plats.
 */

interface TileItem {
  /** Filtre de la carte ciblé par la tuile. */
  id: Filter;
  /** Libellé affiché sous la tuile. */
  label: string;
  /** Nombre de plats de la catégorie (pastille). */
  count: number;
  /** Photo de couverture (image du 1er plat de la catégorie). */
  image: string;
}

interface Props {
  items: TileItem[];
  active: Filter;
  onChange: (filter: Filter) => void;
}

export function CategoryTiles({ items, active, onChange }: Props) {
  return (
    <nav className="carte-tiles" aria-label="Parcourir la carte par catégorie">
      {items.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            className={`ctile ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onChange(t.id)}
          >
            <span className="ctile-img">
              <Image
                src={t.image}
                alt=""
                fill
                sizes="(max-width: 700px) 50vw, 25vw"
              />
              <span className="ctile-count">{t.count}</span>
            </span>
            <span className="ctile-label">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
