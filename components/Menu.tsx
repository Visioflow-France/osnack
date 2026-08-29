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

/** Grand titre affiché au-dessus du contenu (« La Carte » en vue d'accueil). */
const filterTitle = (f: Filter): string =>
  f === 'all' ? 'La Carte' : FILTER_LABELS[f];

/**
 * ── Page « Notre Carte » ─────────────────────────────────────────────────────
 *
 * Organisation :
 *   1. Rangée collante de noms : « Accueil » (vue par défaut, aucune catégorie
 *      pré-sélectionnée) puis toutes les catégories — filtrage instantané,
 *      entrée active marquée d'un trait orange.
 *   2. Vue « Accueil » : titre « La Carte » + les grosses tuiles catégories
 *      comme contenu principal (pas de plats), 4 par ligne desktop, 2 mobile.
 *   3. Catégorie choisie : titre + note, sous-pastilles quand il y a des
 *      sous-catégories (Crêpes → Salées / Sucrées…), grille de cartes
 *      produits, puis à nouveau les tuiles en bas pour continuer.
 *
 * Logique métier conservée : menu servi par l'ISR (aucun fetch client),
 * panier via CartContext + ItemConfigurator, filtre posable par l'URL
 * (`/carte?cat=…`, y compris vers une sous-catégorie).
 */
export function Menu({ initialProducts }: { initialProducts?: Product[] }) {
  // null = vue « Accueil » tant que le client n'a rien choisi.
  const [picked, setPicked] = useState<Filter | null>(null);
  // Sous-catégorie active (Salées, Sucrées…) — ignorée tant qu'elle
  // n'appartient pas à la catégorie courante.
  const [sub, setSub] = useState<Filter | null>(null);
  // Menu chargé une seule fois (props serveur ISR) — aucun polling Firestore.
  const { products } = useProducts(initialProducts);

  // Hide dishes the admin has toggled off (soft remove). Deletion is permanent.
  const visible = useMemo(() => products.filter(isAvailable), [products]);

  // Entrées de la rangée de noms : « Accueil » + une entrée par catégorie.
  // « Nouveautés » n'apparaît que si au moins un plat est marqué neuf.
  const names = useMemo(() => {
    const out: { id: Filter; label: string }[] = [];
    for (const f of MENU_FILTERS) {
      if (f === 'nouveautes' && countByFilter(f, visible) === 0) continue;
      out.push({ id: f, label: FILTER_LABELS[f] });
    }
    return out;
  }, [visible]);

  // Grosses tuiles (vue accueil + bas de page) : les catégories, sans
  // « Accueil ». Photo de couverture = image du 1er plat de la catégorie
  // (auto-maintenue quand l'admin change la carte).
  const tiles = useMemo(() => {
    const out: { id: Filter; label: string; count: number; image: string }[] = [];
    for (const f of MENU_FILTERS) {
      if (f === 'all') continue;
      const count = countByFilter(f, visible);
      if (f === 'nouveautes' && count === 0) continue;
      const cover = visible.find((p) => matchesFilter(p, f))?.image;
      if (!cover) continue;
      out.push({ id: f, label: FILTER_LABELS[f], count, image: cover });
    }
    return out;
  }, [visible]);

  // Vue par défaut : « Accueil » — aucune catégorie pré-sélectionnée.
  const filter = picked ?? 'all';
  const isHome = filter === 'all';
  const kids = isHome ? undefined : FILTER_CHILDREN[filter];
  const activeSub = sub && kids?.includes(sub) ? sub : null;

  const filtered = useMemo(() => {
    if (isHome) return [];
    let list = visible.filter((p) => matchesFilter(p, filter));
    if (activeSub) list = list.filter((p) => matchesFilter(p, activeSub));
    return list;
  }, [isHome, filter, activeSub, visible]);

  // Filtre posé via l'URL (`/carte?cat=burgers`) par les boutons « Découvrir »
  // de la page d'accueil : active le filtre puis amène à la grille. Un lien
  // vers une sous-catégorie (ex. `crepes-salees`) ouvre sa catégorie parente
  // avec la sous-catégorie pré-sélectionnée.
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
      setPicked(cat);
    }
    requestAnimationFrame(() => {
      const target = document.getElementById('menuGrid') ?? document.getElementById('menu');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Clic sur un nom (haut) ou une tuile : change de vue, retombe sur « Toutes »
  // les sous-catégories et ramène au contenu — tuiles en accueil, plats sinon.
  function pick(next: Filter) {
    setPicked(next);
    setSub(null);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = document.getElementById(next === 'all' ? 'menuTiles' : 'menuGrid');
    target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <section className="menu carte section-pad" id="menu">
      {/* Rangée de noms collante sous la nav pendant le scroll. */}
      <div className="carte-names-wrap">
        <div className="container">
          <CategoryNames items={names} active={filter} onChange={pick} />
        </div>
      </div>

      <div className="container">
        {/* key={filter} : le titre et la grille se ré-animent à chaque filtre. */}
        <header className="carte-cat-head" aria-live="polite" key={filter}>
          <h1 className="carte-cat-title">{filterTitle(filter)}</h1>
          {FILTER_NOTES[filter] && (
            <p className="menu-cat-note">{FILTER_NOTES[filter]}</p>
          )}
        </header>

        {isHome ? (
          /* Vue « Accueil » : les grosses tuiles sont LE contenu de la page. */
          <div className="carte-tiles-block carte-tiles-hero" id="menuTiles">
            <p className="carte-tiles-eyebrow">Choisissez une catégorie</p>
            <CategoryTiles items={tiles} active={filter} onChange={pick} />
          </div>
        ) : (
          <>
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

            {/* Grosses tuiles catégories (4 par ligne desktop, 2 mobile) — le
                clic ramène en haut avec la catégorie choisie. */}
            <div className="carte-tiles-block">
              <p className="carte-tiles-eyebrow">Parcourir la carte</p>
              <CategoryTiles items={tiles} active={filter} onChange={pick} />
            </div>
          </>
        )}
      </div>

      {/* Retour visuel immédiat du panier, dès le premier article ajouté. */}
      <CartBar />
    </section>
  );
}
