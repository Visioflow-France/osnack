export type Category =
  | 'sandwichs'
  | 'burgers'
  | 'menus'
  | 'crepes'
  | 'texmex'
  | 'desserts'
  | 'boissons';

export interface Product {
  id: string;
  name: string;
  desc: string;
  /** Base price in EUR (price "seul"). */
  price: number;
  /** Optional promotional price. When set, the base price is shown struck-through. */
  promoPrice?: number | null;
  /** Optional "menu" (combo) price in EUR. Shown alongside the base price. */
  priceMenu?: number | null;
  image: string;
  category: Category;
  tag?: string;
  /** Small muted line rendered under the description (e.g. "Accompagné de sauce maison"). */
  note?: string;
  /** Soft toggle: when false the dish is hidden from the public menu (not deleted). */
  available?: boolean;
  /** Soft toggle: when true the dish is promoted as a "Best Seller" on the vitrine. */
  bestseller?: boolean;
  /** Soft toggle: when true the dish wears a "Nouveau" badge and feeds the Nouveautés bubble. */
  isNew?: boolean;
  /** Sort order (lower first). */
  order?: number;
}

export const CATEGORY_LABELS: Record<Category | 'all', string> = {
  all: 'Tout',
  sandwichs: 'Sandwichs',
  burgers: 'Burgers',
  menus: 'Menus',
  crepes: 'Crêpes',
  texmex: 'Tex Mex',
  desserts: 'Desserts',
  boissons: 'Boissons',
};

export const CATEGORIES: (Category | 'all')[] = [
  'all',
  'sandwichs',
  'burgers',
  'menus',
  'crepes',
  'texmex',
  'desserts',
  'boissons',
];

/**
 * Filtres « virtuels » de la barre de la carte : nouveautés (`isNew`), bons
 * plans (promos + formules), poulet (mots-clés du nom), sous-familles (crêpes
 * salées / sucrées, distinguées par le tag du produit) et regroupement
 * desserts & boissons. Ils ne sont pas des `Category` (le stockage Firestore
 * ne change pas), ce sont des vues supplémentaires proposées au client.
 */
export type SpecialFilter =
  | 'nouveautes'
  | 'bons-plans'
  | 'poulet'
  | 'crepes-salees'
  | 'crepes-sucrees'
  | 'desserts-boissons';

/** Tout ce que la barre de filtres de la carte peut afficher. */
export type Filter = Category | 'all' | SpecialFilter;

export const FILTER_LABELS: Record<Filter, string> = {
  ...CATEGORY_LABELS,
  nouveautes: 'Nouveautés',
  'bons-plans': 'Bons Plans',
  poulet: 'Poulet',
  'crepes-salees': 'Crêpes Salées',
  'crepes-sucrees': 'Crêpes Sucrées',
  'desserts-boissons': 'Desserts & Boissons',
};

/**
 * Ordre d'affichage des bulles de la carte (façon fast-food : les vues
 * « merchandising » d'abord — nouveautés, bons plans — puis les familles).
 */
export const MENU_FILTERS: Filter[] = [
  'all',
  'nouveautes',
  'bons-plans',
  'menus',
  'sandwichs',
  'burgers',
  'poulet',
  'texmex',
  'crepes-salees',
  'crepes-sucrees',
  'desserts-boissons',
];

/** Un crêpe est « sucrée » / « salée » selon son tag (« Sucré(e) » / « Salée »). */
const isSweetCrepe = (p: Product): boolean => /sucr/i.test(p.tag ?? '');
const isSavoryCrepe = (p: Product): boolean => /sal/i.test(p.tag ?? '');

/** Bulle « Poulet » : plats de poulet repérés par mots-clés du nom. */
const POULET_RE = /poulet|chicken|nugget|tender/i;

/** Le produit appartient-il au filtre donné ? */
export const matchesFilter = (p: Product, filter: Filter): boolean => {
  if (filter === 'all') return true;
  if (filter === 'nouveautes') return p.isNew === true;
  if (filter === 'bons-plans') return hasPromo(p) || p.category === 'menus';
  if (filter === 'poulet') return POULET_RE.test(p.name);
  if (filter === 'crepes-salees') return p.category === 'crepes' && isSavoryCrepe(p);
  if (filter === 'crepes-sucrees') return p.category === 'crepes' && isSweetCrepe(p);
  if (filter === 'desserts-boissons')
    return p.category === 'desserts' || p.category === 'boissons';
  return p.category === filter;
};

export const countByFilter = (filter: Filter, list: Product[] = MENU): number =>
  list.filter((p) => matchesFilter(p, filter)).length;

/** Valide une valeur `?cat=` reçue dans l'URL (liens « Découvrir » de l'accueil). */
export const isFilter = (value: string | null): value is Filter =>
  value != null && value in FILTER_LABELS;

/**
 * One-line context shown above the grid when a specific category is selected
 * (bread options, supplements, shared preparation notes…). Avoids repeating the
 * same info on every card.
 */
export const CATEGORY_NOTES: Partial<Record<Category, string>> = {
  sandwichs:
    'Pain au four ou tortillas au choix. Suppléments : Cheddar 0,50 € · Emmental 0,50 € · Boursin 0,80 € · Raclette 0,80 € · Bacon 1,50 €.',
  burgers:
    'Classiques · 180 g (pain sésame ou sans sésame) · Gourmets (steak bouchère 150 g + frites Steak House).',
  menus: 'Formules complètes à prix doux, pensées pour chaque appétit.',
  crepes: 'Pâte à crêpes maison — salées et sucrées.',
  texmex: 'À partager, avec nos sauces maison.',
  desserts: 'Desserts maison et glaces Häagen-Dazs.',
  boissons: 'Boissons fraîches et milkshakes onctueux. Supplément saveur milkshake : +1,00 €.',
};

/** Notes affichées au-dessus de la grille pour chaque filtre de la barre. */
export const FILTER_NOTES: Partial<Record<Filter, string>> = {
  ...CATEGORY_NOTES,
  nouveautes: 'Les dernières recettes arrivées chez O’Snack — fraîchement grillées.',
  'bons-plans': 'Promos du moment et formules complètes à prix doux.',
  poulet: 'Tout le poulet : burgers panés, nuggets et tenders croustillants.',
  'crepes-salees': 'Pâte à crêpes maison — les salées, généreusement garnies.',
  'crepes-sucrees': 'Pâte à crêpes maison — les sucrées, pour les gourmands.',
  'desserts-boissons':
    'Desserts maison, glaces Häagen-Dazs, boissons fraîches et milkshakes onctueux. Supplément saveur milkshake : +1,00 €.',
};

/** True when a promotional price is set and lower than the base price. */
export const hasPromo = (p: Product): boolean =>
  p.promoPrice != null && p.promoPrice > 0 && p.promoPrice < p.price;

/** The price the customer actually pays (promo wins over base). */
export const effectivePrice = (p: Product): number =>
  hasPromo(p) ? (p.promoPrice as number) : p.price;

/** True when a "menu" combo price is set. */
export const hasMenuPrice = (p: Product): boolean =>
  p.priceMenu != null && p.priceMenu > 0;

/** Integer percent off, e.g. 18 for "-18 %". Returns 0 when there is no promo. */
export const promoPercent = (p: Product): number =>
  hasPromo(p) ? Math.round((1 - (p.promoPrice as number) / p.price) * 100) : 0;

/** Whether the dish should be shown to customers. */
export const isAvailable = (p: Product): boolean => p.available !== false;

/** Whether the dish is flagged as a Best Seller on the vitrine. */
export const isBestSeller = (p: Product): boolean => p.bestseller === true;

/**
 * Stable ids used as Best-Seller fallback. Guarantees the vitrine always shows
 * 3 highlights even before the admin toggles anything, or when the live
 * Firestore data does not yet carry the `bestseller` field.
 */
export const BEST_SELLER_FALLBACK_IDS = ['grec', 'menu-supreme', 'g-original'];

/**
 * Pick the Best Sellers to feature on the vitrine.
 * Priority: available items flagged `bestseller === true` (sorted by `order`),
 * then the fallback ids if present, then any remaining item by `order`.
 * The admin can override at any time by toggling `bestseller`.
 */
export const selectBestSellers = (list: Product[], count = 3): Product[] => {
  const byOrder = (a: Product, b: Product) =>
    (a.order ?? 9999) - (b.order ?? 9999) || a.name.localeCompare(b.name, 'fr');

  const flagged = list.filter((p) => isAvailable(p) && isBestSeller(p)).sort(byOrder);
  if (flagged.length >= count) return flagged.slice(0, count);

  const chosen = new Set(flagged.map((p) => p.id));
  const pool = list.filter((p) => isAvailable(p) && !chosen.has(p.id));

  // Top up with the canonical fallback ids when available.
  const byId = new Map(pool.map((p) => [p.id, p] as const));
  const merged = [...flagged];
  for (const id of BEST_SELLER_FALLBACK_IDS) {
    if (merged.length >= count) break;
    const item = byId.get(id);
    if (item) {
      merged.push(item);
      chosen.add(item.id);
    }
  }

  // Last resort: fill with whatever is available, by order.
  if (merged.length < count) {
    for (const item of pool.filter((p) => !chosen.has(p.id)).sort(byOrder)) {
      if (merged.length >= count) break;
      merged.push(item);
    }
  }

  return merged.slice(0, count);
};

const img = (id: string): string =>
  `https://images.unsplash.com/photo-${id}?w=800&auto=format&fit=crop&q=80`;

// Verified Unsplash photo ids, grouped by what they depict.
const IMG = {
  kebab1: img('1555939594-58d7cb561ad1'),
  kebab2: img('1633321702518-7feccafb94d5'),
  kebab3: img('1529006557810-274b9b2fc783'),
  kebab4: img('1583060095186-852adde6b819'),
  sand1: img('1528735602780-2552fd46c7af'),
  sand2: img('1539252554935-80c8cb536cbb'),
  gourmand: img('1551782450-a2132b4ba21d'),
  burger1: img('1568901346375-23c9450c58cd'),
  burger2: img('1550547660-d9450f859349'),
  burger3: img('1561758033-d89a9ad46330'),
  fries: img('1573080496219-bb080dd4f877'),
  onion: img('1639024471283-03518883512d'),
  chicken: img('1626645738196-c2a7c87a8f58'),
  crepe1: img('1519676892522-1d60b5f5c7c3'),
  crepe2: img('1601050690597-df0568f70950'),
  fondant: img('1606313564200-e75d5e30476c'),
  brownie: img('1558961363-fa8fdf82db35'),
  cookies: img('1499636136210-6f4ee915583e'),
  tiramisu: img('1565958011703-44f9829ba187'),
  icecream1: img('1488477181946-6428a0291777'),
  icecream2: img('1576506542790-51244b486a6b'),
  coca: img('1622483767028-3f66f32aef97'),
  water: img('1548839140-29a749e1cf40'),
  lemonade: img('1438638531655-25cb4c1f0d3e'),
  shake1: img('1546173159-315724a31696'),
  shake2: img('1505252585461-04db1eb84625'),
};

export const MENU: Product[] = [
  // ---------------------------- Sandwichs ----------------------------
  {
    id: 'grec',
    name: 'Grec',
    desc: 'Viande grec, pain au four ou tortillas.',
    price: 6.0,
    priceMenu: 7.5,
    image: IMG.kebab1,
    category: 'sandwichs',
    tag: 'Signature',
    bestseller: true,
    order: 11,
  },
  {
    id: 'escalope',
    name: 'Escalope',
    desc: 'Escalope, fromage, pain au four ou tortillas.',
    price: 6.0,
    priceMenu: 7.5,
    image: IMG.sand1,
    category: 'sandwichs',
    order: 12,
  },
  {
    id: 'beef',
    name: 'Beef',
    desc: 'Beef, fromage, pain au four ou tortillas.',
    price: 6.0,
    priceMenu: 7.5,
    image: IMG.kebab2,
    category: 'sandwichs',
    order: 13,
  },
  {
    id: 'merguez',
    name: 'Merguez',
    desc: '2 merguez, fromage, pain au four ou tortillas.',
    price: 6.5,
    priceMenu: 8.0,
    image: IMG.kebab3,
    category: 'sandwichs',
    order: 14,
  },
  {
    id: 'orientale',
    name: 'Orientale',
    desc: '3 steaks 45 g, merguez, poivrons, œuf, fromage.',
    price: 8.0,
    priceMenu: 9.5,
    image: IMG.kebab4,
    category: 'sandwichs',
    tag: 'Gourmande',
    order: 15,
  },
  {
    id: 'escalope-boursin',
    name: 'Escalope Boursin',
    desc: 'Escalope, boursin, pain au four ou tortillas.',
    price: 7.5,
    priceMenu: 9.0,
    image: IMG.sand2,
    category: 'sandwichs',
    order: 16,
  },
  {
    id: 'chicken-curry',
    name: 'Chicken Curry',
    desc: 'Escalope, curry, pain au four ou tortillas.',
    price: 7.0,
    priceMenu: 8.5,
    image: IMG.gourmand,
    category: 'sandwichs',
    order: 17,
  },
  {
    id: 'chicken-tandoori',
    name: 'Chicken Tandoori',
    desc: 'Escalope tandoori, pain au four ou tortillas.',
    price: 7.0,
    priceMenu: 8.5,
    image: IMG.sand1,
    category: 'sandwichs',
    order: 18,
  },
  {
    id: 'le-trio',
    name: 'Le Trio',
    desc: '3 steaks 45 g, fromage, pain au four ou tortillas.',
    price: 7.0,
    priceMenu: 8.5,
    image: IMG.kebab1,
    category: 'sandwichs',
    order: 19,
  },
  {
    id: 'fermiere',
    name: 'Fermière',
    desc: 'Escalope, crème fraîche, champignons.',
    price: 7.5,
    priceMenu: 9.0,
    image: IMG.sand2,
    category: 'sandwichs',
    order: 20,
  },
  {
    id: 'le-bacon',
    name: 'Le Bacon',
    desc: '3 steaks 45 g, bacon, œuf, fromage.',
    price: 7.5,
    priceMenu: 9.0,
    image: IMG.kebab2,
    category: 'sandwichs',
    order: 21,
  },
  {
    id: 'le-savoyard',
    name: 'Le Savoyard',
    desc: 'Escalope, crème fraîche, jambon, fromage, raclette.',
    price: 8.0,
    priceMenu: 9.5,
    image: IMG.gourmand,
    category: 'sandwichs',
    order: 22,
  },
  {
    id: 'radical',
    name: 'Radical',
    desc: '3 steaks 45 g, cordon bleu, fromage.',
    price: 8.0,
    priceMenu: 9.5,
    image: IMG.kebab3,
    category: 'sandwichs',
    order: 23,
  },
  {
    id: 'croq',
    name: 'Croq',
    desc: 'Croque chaud, garni généreusement.',
    price: 3.5,
    image: IMG.sand1,
    category: 'sandwichs',
    note: 'Accompagné de sauce maison.',
    order: 24,
  },

  // ------------------------------ Burgers ------------------------------
  // — Classiques —
  {
    id: 'b-cheese',
    name: 'Cheese',
    desc: '1 steak 45 g, fromage.',
    price: 4.5,
    priceMenu: 6.0,
    image: IMG.burger1,
    category: 'burgers',
    order: 101,
  },
  {
    id: 'b-double-cheese',
    name: 'Double Cheese',
    desc: '2 steaks 45 g, fromage.',
    price: 5.5,
    priceMenu: 7.0,
    image: IMG.burger2,
    category: 'burgers',
    order: 102,
  },
  {
    id: 'b-triple-cheese',
    name: 'Triple Cheese',
    desc: '3 steaks 45 g, fromage.',
    price: 7.0,
    priceMenu: 8.5,
    image: IMG.burger3,
    category: 'burgers',
    order: 103,
  },
  {
    id: 'b-big',
    name: 'Big',
    desc: '2 steaks 45 g, fromage.',
    price: 6.0,
    priceMenu: 7.5,
    image: IMG.burger2,
    category: 'burgers',
    order: 104,
  },
  {
    id: 'b-double-big',
    name: 'Double Big',
    desc: '4 steaks 45 g, fromage.',
    price: 7.5,
    priceMenu: 9.0,
    image: IMG.burger3,
    category: 'burgers',
    order: 105,
  },
  {
    id: 'b-chicken',
    name: 'Chicken Burger',
    desc: 'Poulet pané, fromage.',
    price: 6.0,
    priceMenu: 7.5,
    image: IMG.chicken,
    category: 'burgers',
    order: 106,
  },
  {
    id: 'b-double-chicken',
    name: 'Double Chicken',
    desc: '2 poulets panés, fromage.',
    price: 7.5,
    priceMenu: 9.0,
    image: IMG.chicken,
    category: 'burgers',
    order: 107,
  },
  {
    id: 'b-fish',
    name: 'Le Fish',
    desc: '1 poisson pané, fromage.',
    price: 6.0,
    priceMenu: 7.5,
    image: IMG.burger1,
    category: 'burgers',
    order: 108,
  },
  {
    id: 'b-double-fish',
    name: 'Le Double Fish',
    desc: '2 poissons panés, fromage.',
    price: 7.0,
    priceMenu: 8.5,
    image: IMG.burger2,
    category: 'burgers',
    order: 109,
  },
  {
    id: 'b-big-cheese',
    name: 'Big Cheese',
    desc: '1 steak 90 g, fromage, sauce maison.',
    price: 6.0,
    priceMenu: 7.5,
    image: IMG.burger1,
    category: 'burgers',
    order: 110,
  },
  {
    id: 'b-big-cheese-country',
    name: 'Big Cheese Country',
    desc: '1 steak 90 g, fromage, galette de pommes de terre.',
    price: 7.0,
    priceMenu: 8.5,
    image: IMG.burger2,
    category: 'burgers',
    order: 111,
  },
  {
    id: 'b-big-bacon',
    name: 'Big Bacon',
    desc: '1 steak, fromage, bacon, œuf, sauce maison.',
    price: 8.0,
    priceMenu: 9.5,
    image: IMG.burger3,
    category: 'burgers',
    order: 112,
  },
  {
    id: 'b-vegetarien',
    name: 'Le Végétarien',
    desc: 'Galette de pommes de terre, fromage, tomates confites, champignons.',
    price: 5.5,
    priceMenu: 7.0,
    image: IMG.burger1,
    category: 'burgers',
    tag: 'Végé',
    order: 113,
  },
  // — Série Hummer —
  {
    id: 'hummer-1',
    name: 'Hummer 1',
    desc: 'Recette signature de la série Hummer.',
    price: 7.5,
    image: IMG.burger2,
    category: 'burgers',
    tag: 'Hummer',
    order: 121,
  },
  {
    id: 'hummer-2',
    name: 'Hummer 2',
    desc: 'Recette signature de la série Hummer.',
    price: 9.0,
    image: IMG.burger3,
    category: 'burgers',
    tag: 'Hummer',
    order: 122,
  },
  {
    id: 'hummer-3',
    name: 'Hummer 3',
    desc: 'La plus généreuse de la série Hummer.',
    price: 10.0,
    image: IMG.burger3,
    category: 'burgers',
    tag: 'Hummer',
    order: 123,
  },
  // — 180 g —
  {
    id: 'le-180',
    name: 'Le 180',
    desc: '1 steak 180 g, fromage.',
    price: 7.0,
    priceMenu: 8.5,
    image: IMG.burger1,
    category: 'burgers',
    tag: '180 g',
    order: 131,
  },
  {
    id: 'le-360',
    name: 'Le 360',
    desc: '2 steaks 180 g, fromage.',
    price: 8.5,
    priceMenu: 10.0,
    image: IMG.burger2,
    category: 'burgers',
    tag: '180 g',
    order: 132,
  },
  {
    id: 'le-540',
    name: 'Le 540',
    desc: '3 steaks 180 g, fromage.',
    price: 10.0,
    priceMenu: 11.5,
    image: IMG.burger3,
    category: 'burgers',
    tag: '180 g',
    order: 133,
  },
  // — Gourmets —
  {
    id: 'g-original',
    name: 'Burger Original',
    desc: '1 steak bouchère 150 g, fromage, sauce maison, frites Steak House.',
    price: 10.0,
    priceMenu: 11.5,
    image: IMG.burger2,
    category: 'burgers',
    tag: 'Gourmet',
    bestseller: true,
    order: 141,
  },
  {
    id: 'g-raclette',
    name: 'Burger Raclette',
    desc: '1 steak bouchère 150 g, fromage à raclette, sauce maison, frites Steak House.',
    price: 11.9,
    priceMenu: 13.4,
    image: IMG.burger3,
    category: 'burgers',
    tag: 'Gourmet',
    order: 142,
  },
  {
    id: 'g-bacon-beef',
    name: 'Original Bacon Beef',
    desc: '1 steak bouchère 150 g, fromage, bacon, sauce maison, frites Steak House.',
    price: 12.9,
    priceMenu: 14.4,
    image: IMG.burger3,
    category: 'burgers',
    tag: 'Gourmet',
    order: 143,
  },
  {
    id: 'g-double-original',
    name: 'Double Original',
    desc: '2 steaks bouchère, œuf, fromage, sauce maison, frites Steak House.',
    price: 14.9,
    priceMenu: 16.4,
    image: IMG.burger2,
    category: 'burgers',
    tag: 'Gourmet',
    order: 144,
  },

  // ------------------------------ Menus ------------------------------
  {
    id: 'menu-enfant',
    name: 'Menu Enfant',
    desc: '1 Cheese Burger ou 4 Nuggets + 1 Kinder Surprise + 1 Jus.',
    price: 6.0,
    image: IMG.burger1,
    category: 'menus',
    tag: 'Enfant',
    order: 201,
  },
  {
    id: 'menu-etudiant',
    name: 'Menu Étudiant',
    desc: '1 Sandwich Grec + Cheese Burger + 1 Boisson 33 cl + Frites.',
    price: 7.5,
    image: IMG.kebab1,
    category: 'menus',
    note: 'Valable de 11h30 à 15h00.',
    tag: 'Étudiant',
    order: 202,
  },
  {
    id: 'menu-supreme',
    name: 'Menu Suprême',
    desc: '1 Sandwich Grec + 1 Big Burger + Frites + 1 Boisson 33 cl.',
    price: 11.5,
    image: IMG.burger2,
    category: 'menus',
    tag: 'Le meilleur',
    bestseller: true,
    order: 203,
  },

  // ------------------------------ Crêpes ------------------------------
  {
    id: 'crepe-viande',
    name: 'Crêpe Viande Hachée',
    desc: 'Viande hachée, fromage, œuf.',
    price: 7.0,
    image: IMG.crepe1,
    category: 'crepes',
    tag: 'Salée',
    order: 301,
  },
  {
    id: 'crepe-poulet',
    name: 'Crêpe Poulet',
    desc: 'Poulet, fromage, œuf.',
    price: 6.0,
    image: IMG.crepe1,
    category: 'crepes',
    tag: 'Salée',
    order: 302,
  },
  {
    id: 'crepe-jambon',
    name: 'Crêpe Jambon',
    desc: 'Jambon, fromage, œuf.',
    price: 6.0,
    image: IMG.crepe1,
    category: 'crepes',
    tag: 'Salée',
    order: 303,
  },
  {
    id: 'crepe-thon',
    name: 'Crêpe Thon',
    desc: 'Thon, fromage, œuf.',
    price: 6.0,
    image: IMG.crepe1,
    category: 'crepes',
    tag: 'Salée',
    order: 304,
  },
  {
    id: 'crepe-sucre',
    name: 'Crêpe Sucre',
    desc: 'Sucre, simplement.',
    price: 3.5,
    image: IMG.crepe2,
    category: 'crepes',
    tag: 'Sucrée',
    order: 311,
  },
  {
    id: 'crepe-confiture',
    name: 'Crêpe Confiture',
    desc: 'Confiture fraise ou abricot.',
    price: 4.0,
    image: IMG.crepe2,
    category: 'crepes',
    tag: 'Sucrée',
    order: 312,
  },
  {
    id: 'crepe-nutella',
    name: 'Crêpe Nutella',
    desc: 'Nutella fondant.',
    price: 4.5,
    image: IMG.crepe2,
    category: 'crepes',
    tag: 'Sucrée',
    order: 313,
  },
  {
    id: 'crepe-nutella-banane',
    name: 'Crêpe Nutella Banane',
    desc: 'Nutella et banane fraîche.',
    price: 5.0,
    image: IMG.crepe2,
    category: 'crepes',
    tag: 'Sucrée',
    order: 314,
  },
  {
    id: 'panini-nutella',
    name: 'Panini Nutella',
    desc: 'Pain grillé et Nutella fondu.',
    price: 3.0,
    image: IMG.cookies,
    category: 'crepes',
    tag: 'Sucré',
    order: 315,
  },

  // ------------------------------ Tex Mex ------------------------------
  {
    id: 'tm-nuggets',
    name: 'Nuggets',
    desc: '6 pièces, sauce maison au choix.',
    price: 5.5,
    image: IMG.chicken,
    category: 'texmex',
    order: 401,
  },
  {
    id: 'tm-camembert',
    name: 'Bouchées Camembert',
    desc: '6 pièces croustillantes.',
    price: 5.5,
    image: IMG.onion,
    category: 'texmex',
    order: 402,
  },
  {
    id: 'tm-tenders',
    name: 'Tenders',
    desc: '6 pièces de poulet pané, sauce maison au choix.',
    price: 6.5,
    image: IMG.chicken,
    category: 'texmex',
    order: 403,
  },

  // ------------------------------ Desserts ------------------------------
  {
    id: 'd-tarte-daim',
    name: 'Tarte au Daim',
    desc: 'Tarte fondante au chocolat et caramel.',
    price: 3.0,
    image: IMG.brownie,
    category: 'desserts',
    order: 501,
  },
  {
    id: 'd-tarte-coco',
    name: 'Tarte Coco',
    desc: 'Tarte moelleuse à la noix de coco.',
    price: 3.0,
    image: IMG.cookies,
    category: 'desserts',
    order: 502,
  },
  {
    id: 'd-cookies',
    name: 'Cookies maison',
    desc: 'Moelleux, au chocolat.',
    price: 3.0,
    image: IMG.cookies,
    category: 'desserts',
    tag: 'Maison',
    order: 503,
  },
  {
    id: 'd-brownie',
    name: 'Brownie',
    desc: 'Cœur fondant au chocolat noir.',
    price: 3.0,
    image: IMG.brownie,
    category: 'desserts',
    order: 504,
  },
  {
    id: 'd-tiramisu',
    name: 'Tiramisu maison',
    desc: 'Recette maison, café et mascarpone.',
    price: 3.5,
    image: IMG.tiramisu,
    category: 'desserts',
    tag: 'Maison',
    order: 505,
  },
  {
    id: 'glace-100',
    name: 'Glace Häagen-Dazs',
    desc: 'Pot 100 ml, parfum au choix.',
    price: 3.5,
    image: IMG.icecream1,
    category: 'desserts',
    note: 'Häagen-Dazs.',
    order: 511,
  },
  {
    id: 'glace-500',
    name: 'Glace Häagen-Dazs',
    desc: 'Pot 500 ml, parfum au choix.',
    price: 7.85,
    image: IMG.icecream2,
    category: 'desserts',
    note: 'Häagen-Dazs.',
    order: 512,
  },

  // ------------------------------ Boissons ------------------------------
  {
    id: 'boisson-33',
    name: 'Boisson',
    desc: '33 cl, bien frais.',
    price: 1.2,
    image: IMG.coca,
    category: 'boissons',
    order: 601,
  },
  {
    id: 'boisson-125',
    name: 'Boisson',
    desc: '1,25 L, bien frais.',
    price: 2.5,
    image: IMG.coca,
    category: 'boissons',
    order: 602,
  },
  {
    id: 'boisson-2l',
    name: 'Boisson',
    desc: '2 L, bien frais.',
    price: 3.0,
    image: IMG.coca,
    category: 'boissons',
    order: 603,
  },
  {
    id: 'ms-bounty',
    name: 'Milkshake Bounty',
    desc: 'Lait fouetté, noix de coco et chocolat.',
    price: 4.0,
    image: IMG.shake1,
    category: 'boissons',
    order: 611,
  },
  {
    id: 'ms-oreo',
    name: 'Milkshake Oreo',
    desc: 'Lait fouetté et biscuits Oreo.',
    price: 4.0,
    image: IMG.shake2,
    category: 'boissons',
    order: 612,
  },
  {
    id: 'ms-mars',
    name: 'Milkshake Mars',
    desc: 'Lait fouetté et chocolat Mars.',
    price: 4.0,
    image: IMG.shake1,
    category: 'boissons',
    order: 613,
  },
  {
    id: 'ms-snickers',
    name: 'Milkshake Snickers',
    desc: 'Lait fouetté, caramel et cacahuètes.',
    price: 4.0,
    image: IMG.shake2,
    category: 'boissons',
    order: 614,
  },
  {
    id: 'ms-bueno',
    name: 'Milkshake Kinder Bueno',
    desc: 'Lait fouetté et Kinder Bueno.',
    price: 4.0,
    image: IMG.shake1,
    category: 'boissons',
    order: 615,
  },
  {
    id: 'ms-kitkat',
    name: 'Milkshake Kit-Kat',
    desc: 'Lait fouetté et Kit-Kat croquant.',
    price: 4.0,
    image: IMG.shake2,
    category: 'boissons',
    order: 616,
  },
  {
    id: 'ms-mms',
    name: 'Milkshake M&Ms',
    desc: 'Lait fouetté et M&Ms.',
    price: 4.0,
    image: IMG.shake1,
    category: 'boissons',
    order: 617,
  },
];

// NOTE : pour compter les plats d'un filtre de la barre de la carte (y compris
// les filtres virtuels), utiliser `countByFilter`.
