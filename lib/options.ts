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
  /** single = radio (1 choix), multi = cases à cocher (0..maxSelect). */
  type: 'single' | 'multi';
  /** single : un choix est obligatoire (le 1er est présélectionné). */
  required: boolean;
  choices: OptionChoice[];
  /** Ajoute « Autre (préciser) » avec champ texte libre. */
  allowOther?: boolean;
  /** multi : nombre max de choix simultanés. */
  maxSelect?: number;
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
      label: 'Sauce maison au choix',
      type: 'single',
      required: true,
      choices: plainChoices('texmex-sauce', TEXMEX_SAUCES),
      allowOther: true,
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

/** Résumé compact des options pour l'affichage et le ticket (« Menu · Tortillas · + Bacon »). */
export function summarizeOptions(variant: 'seul' | 'menu', sel: SelectedOption[]): string {
  const parts: string[] = [];
  if (variant === 'menu') parts.push('Menu');
  for (const o of sel) {
    if (o.price > 0) parts.push(`+ ${o.label}`);
    else parts.push(o.label);
  }
  const out = parts.join(' · ');
  return out.length > 160 ? `${out.slice(0, 157)}…` : out;
}

/**
 * Retrouve le prix d'une option à partir de son libellé dans les groupes du
 * produit (contrôle admin anti-fraude). Null = libellé inconnu.
 */
export function priceForOptionLabel(p: Product, label: string): number | null {
  for (const g of optionGroupsFor(p)) {
    const hit = g.choices.find((c) => c.label === label);
    if (hit) return hit.price;
  }
  return null;
}
