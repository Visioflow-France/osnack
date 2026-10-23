/**
 * ── Configuration SEO centrale du site O'Snack Torcy ─────────────────────────
 *
 * DOMAINE : le site est en ligne sur https://www.osnacktorcy.fr (hébergé sur
 * Vercel ; osnacktorcy.fr sans www redirige en 308 vers le www, c'est donc
 * le www qui est l'hôte canonique). Cette URL est utilisée dans TOUT le site
 * (canonical, Open Graph, JSON-LD, sitemap, robots). Pour la surcharger :
 * définir la variable d'environnement NEXT_PUBLIC_SITE_URL (déjà posée dans
 * .env.local et dans le projet Vercel). Toutes les URLs absolues du site
 * sont construites via `absoluteUrl()`.
 */

/** Domaine canonique du site (sans slash final) — fallback si la variable
 * d'environnement NEXT_PUBLIC_SITE_URL n'est pas définie. */
const SITE_URL_PLACEHOLDER = 'https://www.osnacktorcy.fr';

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

/**
 * Mots-clés locaux ciblés (title, description, contenu, JSON-LD).
 * Priorité aux requêtes « fast food / snack / burger + ville » sur Torcy et
 * les communes environnantes couvertes par les pages villes (lib/cities.ts).
 */
export const SEO_KEYWORDS = [
  'snack Torcy',
  'fast food Torcy',
  'burger Torcy',
  'restauration rapide Torcy',
  'restaurant rapide Torcy',
  'snack 77200',
  'fast food 77200',
  'sandwich Torcy',
  'kebab Torcy',
  'crêpe Torcy',
  'à emporter Torcy',
  'livraison Torcy',
  'fast food Noisiel',
  'snack Noisiel',
  'burger Noisiel',
  'fast food Lognes',
  'snack Lognes',
  'burger Lognes',
  'fast food Collégien',
  'snack Collégien',
  'burger Collégien',
  'snack Marne-la-Vallée',
  'fast food Bay 2 Torcy',
  'snack gare de Torcy',
  'O’Snack',
  "O'Snack Torcy",
];

/**
 * Zones desservies (livraison Uber Eats / Deliveroo, alentours de Torcy).
 * Les 4 premières villes ont une page dédiée : accueil (Torcy) +
 * lib/cities.ts (Noisiel, Lognes, Collégien).
 */
export const SERVICE_AREAS = [
  'Torcy',
  'Noisiel',
  'Lognes',
  'Collégien',
  'Marne-la-Vallée',
  'Saint-Thibault-des-Vignes',
  'Vaires-sur-Marne',
  'Lagny-sur-Marne',
  'Pomponne',
  'Chanteloup-en-Brie',
  'Bussy-Saint-Martin',
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
  { path: '/fast-food-noisiel', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/fast-food-lognes', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/fast-food-collegien', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/histoire', priority: 0.5, changeFrequency: 'yearly' },
  // /compte est exclu : robots.txt l'interdit à l'indexation (page client).
  { path: '/mentions-legales', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/cgv', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/confidentialite', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.2, changeFrequency: 'yearly' },
];
