'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FILTER_CHILDREN,
  FILTER_LABELS,
  FILTER_NOTES,
  MENU_FILTERS,
  countByFilter,
  isAvailable,
  isFilter,
  matchesFilter,
  type Filter,
  type Product,
} from '@/lib/menu';
import { useProducts } from '@/lib/useProducts';
import { CartBar } from './cart/CartBar';
import { CategoryNames } from './carte/CategoryNames';
import { CategoryTiles } from './carte/CategoryTiles';
import { ProductCard } from './carte/ProductCard';

/**
 * ── Page « Notre Carte » ─────────────────────────────────────────────────────
 *
 * Organisation :
 *   1. Rangée collante de noms de catégories (sous la nav) — filtrage
 *      instantané, catégorie active marquée d'un trait orange.
 *   2. Titre de la catégorie active + note, sous-pastilles quand la catégorie
 *      a des sous-catégories (Crêpes → Salées / Sucrées, Desserts & Boissons
 *      → Desserts / Boissons), puis grille de cartes produits.
 *   3. En bas de page : grosses tuiles catégories (4 par ligne desktop,
 *      2 mobile) — le clic change de catégorie et ramène à la grille.
 *
 * Pas de vue « Tout » : la page s'ouvre sur Nouveautés (si présentes), sinon
 * Menus. Logique métier conservée : menu servi par l'ISR (aucun fetch
 * client), panier via CartContext + ItemConfigurator, filtre posable par
 * l'URL (`/carte?cat=…`, y compris vers une sous-catégorie).
 */
export function Menu({ initialProducts }: { initialProducts?: Product[] }) {
  // null = choix automatique tant que le client n'a pas cliqué d'entrée.
  const [picked, setPicked] = useState<Filter | null>(null);
  // Sous-catégorie active (Salées, Sucrées…) — ignorée tant qu'elle
  // n'appartient pas à la catégorie courante.
  const [sub, setSub] = useState<Filter | null>(null);
  // Menu chargé une seule fois (props serveur ISR) — aucun polling Firestore.
  const { products } = useProducts(initialProducts);

  // Hide dishes the admin has toggled off (soft remove). Deletion is permanent.
  const visible = useMemo(() => products.filter(isAvailable), [products]);

  // Données des noms (haut) et des tuiles (bas) : une entrée par filtre, photo
  // de couverture = image du 1er plat du filtre (auto-maintenue quand l'admin
  // change la carte). « Nouveautés » n'apparaît que si au moins un plat est
  // marqué neuf.
  const tiles = useMemo(() => {
    const out: { id: Filter; label: string; count: number; image: string }[] = [];
    for (const f of MENU_FILTERS) {
      const count = countByFilter(f, visible);
      if (f === 'nouveautes' && count === 0) continue;
      const cover = visible.find((p) => matchesFilter(p, f))?.image;
      if (!cover) continue;
      out.push({ id: f, label: FILTER_LABELS[f], count, image: cover });
    }
    return out;
  }, [visible]);

  // Catégorie d'ouverture : Nouveautés si présentes, sinon Menus, sinon la
  // première entrée disponible.
  const defaultFilter = useMemo<Filter>(() => {
    const has = (f: Filter) => tiles.some((t) => t.id === f);
    if (has('nouveautes')) return 'nouveautes';
    if (has('menus')) return 'menus';
    return tiles[0]?.id ?? 'menus';
  }, [tiles]);

  const filter = picked ?? defaultFilter;
  const kids = FILTER_CHILDREN[filter];
  const activeSub = sub && kids?.includes(sub) ? sub : null;

  const filtered = useMemo(() => {
    let list = visible.filter((p) => matchesFilter(p, filter));
    if (activeSub) list = list.filter((p) => matchesFilter(p, activeSub));
    return list;
  }, [filter, activeSub, visible]);

  // Filtre posé via l'URL (`/carte?cat=burgers`) par les boutons « Découvrir »
  // de la page d'accueil : active le filtre puis amène à la grille. Un lien
  // vers une sous-catégorie (ex. `crepes-salees`) ouvre sa catégorie parente
  // avec la sous-catégorie pré-sélectionnée ; les vieux liens `cat=all`
  // retombent sur la catégorie d'ouverture.
  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get('cat');
    if (!cat || !isFilter(cat)) return;
    const parent = (Object.keys(FILTER_CHILDREN) as Filter[]).find((f) =>
      FILTER_CHILDREN[f]?.includes(cat),
    );
    if (parent) {
      setPicked(parent);
      setSub(cat);
    } else {
      setPicked(cat === 'all' ? null : cat);
    }
    requestAnimationFrame(() => {
      const target = document.getElementById('menuGrid') ?? document.getElementById('menu');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Clic sur un nom (haut) ou une tuile (bas) : change de catégorie, retombe
  // sur « Toutes » les sous-catégories et ramène à la grille de plats.
  function pick(next: Filter) {
    setPicked(next);
    setSub(null);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById('menuGrid')
      ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <section className="menu carte section-pad" id="menu">
      {/* Rangée de noms collante sous la nav pendant le scroll. */}
      <div className="carte-names-wrap">
        <div className="container">
          <CategoryNames items={tiles} active={filter} onChange={pick} />
        </div>
      </div>

      <div className="container">
        {/* key : le titre et la grille se ré-animent à chaque (sous-)filtre. */}
        <header className="carte-cat-head" aria-live="polite" key={filter}>
          <h1 className="carte-cat-title">{FILTER_LABELS[filter]}</h1>
          {FILTER_NOTES[filter] && (
            <p className="menu-cat-note">{FILTER_NOTES[filter]}</p>
          )}
        </header>

        {kids && kids.length > 0 && (
          <div className="carte-subs" role="tablist" aria-label="Sous-catégories">
            <button
              type="button"
              role="tab"
              aria-selected={activeSub === null}
              className={`csub ${activeSub === null ? 'active' : ''}`}
              onClick={() => setSub(null)}
            >
              Toutes
            </button>
            {kids.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={activeSub === k}
                className={`csub ${activeSub === k ? 'active' : ''}`}
                onClick={() => setSub(k)}
              >
                {FILTER_LABELS[k]}
              </button>
            ))}
          </div>
        )}

        <div className="carte-grid" id="menuGrid" key={`${filter}:${activeSub ?? ''}`}>
          {filtered.length === 0 ? (
            <div className="carte-empty">
              Aucun plat dans cette catégorie pour le moment — revenez bientôt.
            </div>
          ) : (
            filtered.map((item, i) => (
              <ProductCard key={item.id} product={item} index={i} />)
            )
          )}
        </div>

        {/* Grosses tuiles catégories (4 par ligne desktop, 2 mobile) — le clic
            ramène à la grille avec la catégorie choisie. */}
        <div className="carte-tiles-block">
          <p className="carte-tiles-eyebrow">Parcourir la carte</p>
          <CategoryTiles items={tiles} active={filter} onChange={pick} />
        </div>
      </div>

      {/* Retour visuel immédiat du panier, dès le premier article ajouté. */}
      <CartBar />
    </section>
  );
}
