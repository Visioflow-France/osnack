import { LINKS } from './links';
import { BUSINESS, GEO, OPENING_HOURS_SCHEMA, SERVICE_AREAS, absoluteUrl } from './site';
import { CATEGORY_LABELS, MENU, effectivePrice, isAvailable, type Category, type Product } from './menu';

/**
 * ── Données structurées Schema.org (JSON-LD) ─────────────────────────────────
 *
 * Construit le graphe JSON-LD du site : FastFoodRestaurant (fiche locale
 * complète : adresse à Torcy, géolocalisation, horaires, carte, zones
 * desservies) + WebSite. La page /carte ajoute un schéma Menu détaillé
 * (sections + prix) construit depuis le menu statique embarqué — aucune
 * lecture Firestore supplémentaire.
 */

/** Ordre logique des sections de la carte dans le JSON-LD. */
const MENU_SECTION_ORDER: Category[] = [
  'sandwichs',
  'burgers',
  'menus',
  'crepes',
  'texmex',
  'desserts',
  'boissons',
];

/** Un plat du menu en objet Schema.org `MenuItem`. */
const menuItemSchema = (p: Product) => ({
  '@type': 'MenuItem',
  name: p.name,
  description: p.desc,
  image: p.image,
  offers: {
    '@type': 'Offer',
    price: effectivePrice(p).toFixed(2),
    priceCurrency: 'EUR',
    availability: isAvailable(p)
      ? 'https://schema.org/InStock'
      : 'https://schema.org/SoldOut',
  },
});

/** Schéma `Menu` complet (sections par catégorie + items + prix). */
export function menuJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': absoluteUrl('/carte#menu'),
    name: "Carte du snack O'Snack Torcy — restauration rapide",
    url: absoluteUrl('/carte'),
    inLanguage: 'fr-FR',
    hasMenuSection: MENU_SECTION_ORDER.map((category) => ({
      '@type': 'MenuSection',
      name: CATEGORY_LABELS[category],
      hasMenuItem: MENU.filter((p) => p.category === category && isAvailable(p)).map(
        menuItemSchema,
      ),
    })),
  };
}

/** Graphe principal : FastFoodRestaurant + WebSite (injecté dans le layout). */
export function siteJsonLd() {
  const restaurant = {
    '@type': 'FastFoodRestaurant',
    '@id': absoluteUrl('/#restaurant'),
    name: BUSINESS.name,
    alternateName: BUSINESS.alternateName,
    description:
      "O'Snack Torcy, snack et fast food au cœur de Torcy (77200) : sandwichs au four, burgers maison, crêpes, tex-mex et milkshakes. Restauration rapide à emporter, sur place et en livraison, ouverte 7j/7.",
    url: absoluteUrl('/'),
    telephone: BUSINESS.phoneInternational,
    image: [absoluteUrl('/og-image.jpg'), absoluteUrl('/hero-desktop.webp')],
    logo: absoluteUrl('/icon.svg'),
    priceRange: '€',
    currenciesAccepted: 'EUR',
    paymentAccepted: 'Espèces, Carte bancaire',
    servesCuisine: [
      'Fast Food',
      'Snack',
      'Burgers',
      'Sandwichs',
      'Kebab',
      'Crêpes',
      'Tex-Mex',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.city,
      postalCode: BUSINESS.postalCode,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: GEO.latitude,
      longitude: GEO.longitude,
    },
    hasMap: LINKS.addressQuery,
    openingHoursSpecification: OPENING_HOURS_SCHEMA,
    hasMenu: absoluteUrl('/carte'),
    acceptsReservations: 'False',
    smokingAllowed: 'False',
    areaServed: SERVICE_AREAS.map((name) => ({
      '@type': 'City',
      name,
    })),
    potentialAction: [
      {
        '@type': 'OrderAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: absoluteUrl('/commander'),
          actionPlatform: [
            'https://schema.org/DesktopWebPlatform',
            'https://schema.org/MobileWebPlatform',
          ],
          inLanguage: 'fr-FR',
        },
        deliveryMethod: 'https://purl.org/goodrelations/v1#DeliveryModePickUp',
      },
    ],
    sameAs: [LINKS.instagram, LINKS.uberEats, LINKS.deliveroo],
  };

  const website = {
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    url: absoluteUrl('/'),
    name: BUSINESS.name,
    inLanguage: 'fr-FR',
    publisher: { '@id': absoluteUrl('/#restaurant') },
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [restaurant, website],
  };
}

/** Fil d'Ariane Schema.org pour les pages internes. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Accueil', path: '/' }, ...items].map(
      (item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: absoluteUrl(item.path),
      }),
    ),
  };
}
