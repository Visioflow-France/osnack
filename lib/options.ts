import { effectivePrice, hasMenuPrice, type Product } from './menu';

/**
 * ── Moteur d'options de la commande en ligne ─────────────────────────────────
 *
 * Chaque groupe ci-dessous pose UNE question au client (pain, parfum, sauce…).
 * Le client n'envoie que des SÉLECTIONS (libellés) : le prix unitaire est
 * toujours (re)calculé ici — côté ajout au panier, côté checkout, puis côté
 * admin pour le contrôle anti-fraude (lib/orderCheck.ts).
 *
 * Les listes sont éditables en tête de fichier : ajuste-les à la carte réelle
 * du comptoir sans toucher à la logique. « Autre (préciser) » couvre partout
 * les cas non listés.
 */

/* ─────────────────────────── MODIFIER ICI ─────────────────────────── */

/** Choix de pain des sandwichs (hors Croq, déjà constitué). */
const BREAD_SANDWICH = ['Pain au four', 'Tortillas'];
/** Choix de pain des burgers classiques / 180 g (les Gourmets & Hummer ont le leur). */
const BREAD_BURGER = ['Sésame', 'Sans sésame'];
/** Suppléments sandwichs — libellé → prix € (aligné sur la note de la carte). */
const SUPPLEMENTS: [string, number][] = [
  ['Cheddar', 0.5],
  ['Emmental', 0.5],
  ['Boursin', 0.8],
  ['Raclette', 0.8],
  ['Bacon', 1.5],
];
/** Sodas proposés pour les articles « Boisson ». */
const SODAS = ['Coca-Cola', 'Coca-Cola Zéro', 'Fanta', 'Sprite', 'Ice Tea'];
/** Parfums Häagen-Dazs (pots 100 / 500 ml). */
const HAAGEN_FLAVORS = ['Vanille', 'Chocolat', 'Fraise', 'Cookies', 'Mangue', 'Pistache'];
/** Sauces maison des articles tex-mex. */
const TEXMEX_SAUCES = ['Algérienne', 'Samouraï', 'Andalouse', 'Blanche', 'Ketchup', 'Mayo'];
/** Groupes sauces : nombre d'unités offertes (2× la même ou 2 différentes),
 *  prix de chaque unité au-delà, plafond d'unités toutes sauces confondues
 *  (≤ 8 aussi imposé par les rules Firestore sur items.options). */
const SAUCE_FREE_UNITS = 2;
const SAUCE_EXTRA_PRICE = 0.3;
const SAUCE_MAX_TOTAL = 6;
/** Alternative du Menu Enfant. */
const MENU_ENFANT_CHOICES = ['Cheese Burger', '4 Nuggets'];

/* ───────────────────────────── FIN MODIF ──────────────────────────── */

/** Un choix possible dans un groupe (price 0 = inclus dans le prix). */
export interface OptionChoice {
  id: string;
  label: string;
  price: number;
}

/** Un groupe d'options = une question posée sur un article. */
export interface OptionGroup {
  id: string;
  /** Question affichée (ex. « Pain au choix »). */
  label: string;
  /** single = radio (1 choix), multi = cases à cocher (0..maxSelect),
   *  sauces = quantités par sauce (steppers, 2 offertes puis supplément). */
  type: 'single' | 'multi' | 'sauces';
  /** single/sauces : au moins une réponse est obligatoire. */
  required: boolean;
  choices: OptionChoice[];
  /** Ajoute « Autre (préciser) » avec champ texte libre. */
  allowOther?: boolean;
  /** multi : nombre max de choix simultanés. */
  maxSelect?: number;
  /** sauces : unités offertes (identiques ou différentes). */
  freeUnits?: number;
  /** sauces : prix de chaque unité au-delà des unités offertes. */
  extraUnitPrice?: number;
  /** sauces : nombre max d'unités toutes sauces confondues. */
  maxTotal?: number;
}

/** Une option sélectionnée, telle que stockée dans une ligne du panier. */
export interface SelectedOption {
  groupId: string;
  groupLabel: string;
  label: string;
  price: number;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');

const plainChoices = (groupId: string, labels: string[]): OptionChoice[] =>
  labels.map((label) => ({ id: `${groupId}-${slug(label)}`, label, price: 0 }));

const pricedChoices = (groupId: string, entries: [string, number][]): OptionChoice[] =>
  entries.map(([label, price]) => ({ id: `${groupId}-${slug(label)}`, label, price }));

/* ─────────────────────── Groupes applicables ─────────────────────── */

/** Burgers dont le pain est laissé au choix (classiques + 180 g — pas Gourmet/Hummer). */
const BURGER_BREAD_TAGS_EXCLUDED = ['Hummer', 'Gourmet'];

function burgerHasBreadChoice(p: Product): boolean {
  return p.category === 'burgers' && !BURGER_BREAD_TAGS_EXCLUDED.includes(p.tag ?? '');
}

/** Produits « parfum au choix » — ids éditables si la carte évolue. */
const SODA_PRODUCT_IDS = ['boisson-33', 'boisson-125', 'boisson-2l'];
const TEXMEX_SAUCE_IDS = ['tm-nuggets', 'tm-tenders'];

/** Détermine les groupes d'options d'un produit, dans l'ordre d'affichage. */
export function optionGroupsFor(p: Product): OptionGroup[] {
  const groups: OptionGroup[] = [];

  if (p.category === 'sandwichs' && p.id !== 'croq') {
    groups.push({
      id: 'pain-sandwich',
      label: 'Pain au choix',
      type: 'single',
      required: true,
      choices: plainChoices('pain-sandwich', BREAD_SANDWICH),
    });
  }
  if (burgerHasBreadChoice(p)) {
    groups.push({
      id: 'pain-burger',
      label: 'Pain au choix',
      type: 'single',
      required: true,
      choices: plainChoices('pain-burger', BREAD_BURGER),
    });
  }
  if (p.category === 'sandwichs' && p.id !== 'croq') {
    groups.push({
      id: 'supplements',
      label: 'Suppléments',
      type: 'multi',
      required: false,
      choices: pricedChoices('supplements', SUPPLEMENTS),
      maxSelect: 5,
    });
  }
  if (SODA_PRODUCT_IDS.includes(p.id)) {
    groups.push({
      id: 'soda',
      label: 'Boisson au choix',
      type: 'single',
      required: true,
      choices: plainChoices('soda', SODAS),
      allowOther: true,
    });
  }
  if (p.name.toLowerCase().includes('häagen')) {
    groups.push({
      id: 'haagen',
      label: 'Parfum au choix',
      type: 'single',
      required: true,
      choices: plainChoices('haagen', HAAGEN_FLAVORS),
      allowOther: true,
    });
  }
  if (TEXMEX_SAUCE_IDS.includes(p.id)) {
    groups.push({
      id: 'texmex-sauce',
      label: 'Sauces maison',
      type: 'sauces',
      required: true,
      choices: plainChoices('texmex-sauce', TEXMEX_SAUCES),
      allowOther: true,
      freeUnits: SAUCE_FREE_UNITS,
      extraUnitPrice: SAUCE_EXTRA_PRICE,
      maxTotal: SAUCE_MAX_TOTAL,
    });
  }
  if (p.id === 'menu-enfant') {
    groups.push({
      id: 'menu-enfant',
      label: 'Au choix',
      type: 'single',
      required: true,
      choices: plainChoices('menu-enfant', MENU_ENFANT_CHOICES),
    });
  }
  return groups;
}

/** L'article ouvre-t-il la modale de configuration (groupes OU formule menu) ? */
export const hasConfigurator = (p: Product): boolean =>
  optionGroupsFor(p).length > 0 || hasMenuPrice(p);

/** Sélection par défaut : 1er choix de chaque groupe single requis. */
export function defaultSelections(p: Product): SelectedOption[] {
  return optionGroupsFor(p)
    .filter((g) => g.type === 'single' && g.required)
    .map((g) => ({
      groupId: g.id,
      groupLabel: g.label,
      label: g.choices[0].label,
      price: 0,
    }));
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Prix de la n-ième unité d'un groupe sauces (0 = offerte) : les
 * `freeUnits` premières unités — identiques ou différentes — sont incluses,
 * chaque unité suivante coûte `extraUnitPrice`. Le total d'un groupe étant
 * la somme de ces unités, il ne dépend pas de l'ordre de sélection.
 */
export function sauceUnitPrice(g: OptionGroup, unitIndex: number): number {
  return unitIndex < (g.freeUnits ?? 0) ? 0 : (g.extraUnitPrice ?? 0);
}

/**
 * Prix unitaire d'une ligne : base (promo > prix normal) ou formule menu,
 * + le prix de chaque option sélectionnée (suppléments, +1 € saveur…).
 */
export function computeUnitPrice(
  p: Product,
  variant: 'seul' | 'menu',
  sel: SelectedOption[],
): number {
  const base =
    variant === 'menu' && hasMenuPrice(p) ? (p.priceMenu as number) : effectivePrice(p);
  return round2(base + sel.reduce((sum, o) => sum + (o.price ?? 0), 0));
}

/** Résumé compact des options pour l'affichage et le ticket
 *  (« Menu · Tortillas · Algérienne ×2 · + Samouraï »). Les libellés
 *  identiques (une sauce prise plusieurs fois) sont agrégés en « ×n ». */
export function summarizeOptions(variant: 'seul' | 'menu', sel: SelectedOption[]): string {
  const parts: string[] = [];
  if (variant === 'menu') parts.push('Menu');
  const agg = new Map<string, { n: number; price: number }>();
  for (const o of sel) {
    const hit = agg.get(o.label);
    if (hit) {
      hit.n += 1;
      hit.price += o.price ?? 0;
    } else {
      agg.set(o.label, { n: 1, price: o.price ?? 0 });
    }
  }
  for (const [label, { n, price }] of agg) {
    const l = n > 1 ? `${label} ×${n}` : label;
    parts.push(price > 0 ? `+ ${l}` : l);
  }
  const out = parts.join(' · ');
  return out.length > 160 ? `${out.slice(0, 157)}…` : out;
}

/**
 * Recalcule la somme des options d'une ligne depuis la carte (contrôle
 * anti-fraude admin) : chaque libellé est re-matché dans la config du
 * produit. Pour un groupe sauces, chaque entrée = 1 unité prixée selon sa
 * position cumulée (2 offertes puis extraUnitPrice) — la somme reste juste
 * quel que soit l'ordre du tableau. Les libellés « Autre : … » d'un groupe
 * sauces à allowOther comptent comme des unités (texte libre invérifiable).
 * Retourne la somme attendue et les libellés inconnus.
 */
export function recalcOptionPrices(
  p: Product,
  sel: { label: string; price?: number }[],
): { sum: number; unknown: string[] } {
  let sum = 0;
  const unknown: string[] = [];
  const groups = optionGroupsFor(p);
  const sauceUnits = new Map<string, number>(); // groupId → unités déjà comptées
  for (const o of sel) {
    const group = groups.find((g) => g.choices.some((c) => c.label === o.label));
    if (!group) {
      const sauceOther = o.label.startsWith('Autre')
        ? groups.find((g) => g.type === 'sauces' && g.allowOther)
        : undefined;
      if (sauceOther) {
        const seen = sauceUnits.get(sauceOther.id) ?? 0;
        sum += sauceUnitPrice(sauceOther, seen);
        sauceUnits.set(sauceOther.id, seen + 1);
        continue;
      }
      unknown.push(o.label);
      sum += o.price ?? 0; // on compte le prix envoyé, mais on signale
      continue;
    }
    if (group.type === 'sauces') {
      const seen = sauceUnits.get(group.id) ?? 0;
      sum += sauceUnitPrice(group, seen);
      sauceUnits.set(group.id, seen + 1);
    } else {
      sum += group.choices.find((c) => c.label === o.label)?.price ?? 0;
    }
  }
  return { sum: round2(sum), unknown };
}
