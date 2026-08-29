'use client';

import { useEffect, useMemo, useState } from 'react';
import {
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
import { CategoryBubbles, type BubbleItem } from './carte/CategoryBubbles';
import { ProductCard } from './carte/ProductCard';

/**
 * ── Page « Notre Carte » (organisation façon Burger King) ────────────────────
 *
 * Structure, calquée sur burgerking.fr/carte :
 *   1. Bandeau de tuiles carrées arrondies (photo plein cadre + libellé
 *      dessous), collant sous la nav pendant le défilement — filtrage
 *      instantané, sans rechargement.
 *   2. Gros titre de la catégorie active + note contextuelle, puis grille de
 *      cartes produits (2 col. mobile → 4 col. desktop) avec badges
 *      Nouveau / -% / Top Ventes / Veggie et pastille ronde « + » d'ajout.
 *
 * Pas de vue « Tout » : comme chez BK, la page s'ouvre directement sur une
 * catégorie — Nouveautés si la carte en compte, sinon Menus. La logique métier
 * est conservée : menu servi par l'ISR (aucun fetch client), panier via
 * CartContext + ItemConfigurator, filtre posable par l'URL (`/carte?cat=…`).
 */
export function Menu({ initialProducts }: { initialProducts?: Product[] }) {
  // null = choix automatique tant que le client n'a pas cliqué de tuile.
  const [picked, setPicked] = useState<Filter | null>(null);
  // Menu chargé une seule fois (props serveur ISR) — aucun polling Firestore.
  const { products } = useProducts(initialProducts);

  // Hide dishes the admin has toggled off (soft remove). Deletion is permanent.
  const visible = useMemo(() => products.filter(isAvailable), [products]);

  // Données du bandeau de tuiles : une tuile par filtre, photo de couverture =
  // image du 1er plat du filtre (auto-maintenue quand l'admin change la carte).
  // La tuile « Nouveautés » n'apparaît que si au moins un plat est marqué neuf.
  const bubbles = useMemo<BubbleItem[]>(() => {
    const out: BubbleItem[] = [];
    for (const f of MENU_FILTERS) {
      const count = countByFilter(f, visible);
      if (f === 'nouveautes' && count === 0) continue;
      const cover = visible.find((p) => matchesFilter(p, f))?.image;
      if (!cover) continue;
      out.push({ id: f, label: FILTER_LABELS[f], count, image: cover });
    }
    return out;
  }, [visible]);

  // Catégorie d'ouverture (façon BK) : Nouveautés si présentes, sinon Menus,
  // sinon la première tuile disponible.
  const defaultFilter = useMemo<Filter>(() => {
    const has = (f: Filter) => bubbles.some((b) => b.id === f);
    if (has('nouveautes')) return 'nouveautes';
    if (has('menus')) return 'menus';
    return bubbles[0]?.id ?? 'menus';
  }, [bubbles]);

  const filter = picked ?? defaultFilter;

  const filtered = useMemo(
    () => visible.filter((p) => matchesFilter(p, filter)),
    [filter, visible],
  );

  // Filtre posé via l'URL (`/carte?cat=burgers`) par les boutons « Découvrir »
  // de la page d'accueil : active le filtre puis amène à la grille. Les vieux
  // liens `cat=all` retombent sur la catégorie d'ouverture.
  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get('cat');
    if (!cat || !isFilter(cat)) return;
    setPicked(cat === 'all' ? null : cat);
    requestAnimationFrame(() => {
      const target = document.getElementById('menuGrid') ?? document.getElementById('menu');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  return (
    <section className="menu carte section-pad" id="menu">
      {/* Bandeau de tuiles carrées, collant sous la nav pendant le scroll (BK). */}
      <div className="carte-bubbles-wrap">
        <div className="container">
          <CategoryBubbles items={bubbles} active={filter} onChange={setPicked} />
        </div>
      </div>

      <div className="container">
        {/* key={filter} : le titre et la grille se ré-animent à chaque tuile. */}
        <header className="carte-cat-head" aria-live="polite" key={filter}>
          <h1 className="carte-cat-title">{FILTER_LABELS[filter]}</h1>
          {FILTER_NOTES[filter] && (
            <p className="menu-cat-note">{FILTER_NOTES[filter]}</p>
          )}
        </header>

        <div className="carte-grid" id="menuGrid" key={filter}>
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
      </div>

      {/* Retour visuel immédiat du panier, dès le premier article ajouté. */}
      <CartBar />
    </section>
  );
}
