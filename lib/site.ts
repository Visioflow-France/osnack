/**
 * ── Configuration SEO centrale du site O'Snack Torcy ─────────────────────────
 *
 * ⚠️ DOMAINE : le nom de domaine définitif n'est pas encore connu.
 * Le placeholder ci-dessous est utilisé dans TOUT le site (canonical, Open
 * Graph, JSON-LD, sitemap, robots). Pour le remplacer, DEUX options :
 *   1. Définir la variable d'environnement NEXT_PUBLIC_SITE_URL (recommandé,
 *      aucun changement de code au déploiement) ;
 *   2. Modifier la valeur de SITE_URL ci-dessous.
 * Toutes les URLs absolues du site sont construites via `absoluteUrl()`.
 */

/** Domaine placeholder — à remplacer par le domaine définitif. */
const SITE_URL_PLACEHOLDER = 'https://example.fr';

/** URL canonique du site (sans slash final). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ??
  SITE_URL_PLACEHOLDER;

/** Construit une URL absolue à partir d'un chemin interne ("/carte"…). */
export const absoluteUrl = (path = '/'): string =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** Informations d'identité locale (NAP : Name, Address, Phone). */
export const BUSINESS = {
  name: "O'Snack Torcy",
  alternateName: "O'Snack",
  legalName: "O'Snack",
  /** ⚠️ Vérifier les coordonnées GPS exactes sur Google Maps (clic droit sur
   * l'établissement → coordonnées) et ajuster GEO ci-dessous. */
  streetAddress: '57 Rue de Paris',
  postalCode: '77200',
  city: 'Torcy',
  region: 'Île-de-France',
  country: 'FR',
  phone: '09 88 08 61 25',
  phoneInternational: '+33988086125',
} as const;

/** Géolocalisation du restaurant (à affiner si besoin — voir BUSINESS). */
export const GEO = {
  latitude: 48.8432,
  longitude: 2.6535,
} as const;

/** Mots-clés locaux ciblés (title, description, contenu, JSON-LD). */
export const SEO_KEYWORDS = [
  'snack Torcy',
  'fast food Torcy',
  'restauration rapide Torcy',
  'restaurant rapide Torcy',
  'snack 77200',
  'fast food 77200',
  'burger Torcy',
  'sandwich Torcy',
  'kebab Torcy',
  'crêpe Torcy',
  'à emporter Torcy',
  'livraison Torcy',
  'snack Marne-la-Vallée',
  'fast food Bay 2 Torcy',
  'snack gare de Torcy',
  'O’Snack',
  "O'Snack Torcy",
];

/** Zones desservies (livraison Uber Eats / Deliveroo, alentours de Torcy). */
export const SERVICE_AREAS = [
  'Torcy',
  'Marne-la-Vallée',
  'Saint-Thibault-des-Vignes',
  'Vaires-sur-Marne',
  'Lagny-sur-Marne',
  'Pomponne',
  'Chanteloup-en-Brie',
  'Bussy-Saint-Martin',
  'Collégien',
];

/**
 * Horaires d'ouverture au format Schema.org (source : lib/opening.ts,
 * SERVICE_RANGES — 11h30–14h30 et 18h00–01h00, 7 j/7).
 */
export const OPENING_HOURS_SCHEMA = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    opens: '11:30',
    closes: '14:30',
  },
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    opens: '18:00',
    closes: '01:00',
  },
];

/** Liste des pages publiques indexables (utilisée par le sitemap). */
export const SITEMAP_PAGES: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/carte', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/commander', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/histoire', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/compte', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/mentions-legales', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/cgv', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/confidentialite', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.2, changeFrequency: 'yearly' },
];
