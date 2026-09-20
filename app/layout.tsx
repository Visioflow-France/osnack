import type { Metadata, Viewport } from 'next';
import { Montserrat, Inter, IBM_Plex_Mono } from 'next/font/google';
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { ParticleFieldClient } from '@/components/ParticleFieldClient';
import { AuthProvider } from '@/components/AuthContext';
import { CartProvider } from '@/components/CartContext';
import { siteJsonLd } from '@/lib/schema';
import { BUSINESS, GEO, SEO_KEYWORDS, absoluteUrl } from '@/lib/site';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-ibm',
  display: 'swap',
});

// ── SEO local : title/description par défaut (l'accueil et chaque page
// redéfinissent les leurs). Mots-clés « snack Torcy », « fast food Torcy »
// et « restauration rapide Torcy » placés en début de balise.
export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl('/')),
  title: {
    default: 'Snack Torcy | Fast Food & Restauration Rapide — O’Snack 77200',
    template: "%s | O'Snack Torcy",
  },
  description:
    "Snack et fast food à Torcy (77200) : O'Snack, votre restauration rapide au 57 Rue de Paris. Burgers maison, sandwichs au four, crêpes & menus à emporter ou en livraison. Ouvert 7j/7.",
  keywords: SEO_KEYWORDS,
  applicationName: BUSINESS.name,
  authors: [{ name: BUSINESS.name }],
  creator: BUSINESS.name,
  publisher: BUSINESS.name,
  category: 'restauration rapide',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: absoluteUrl('/'),
    siteName: BUSINESS.name,
    title: "Snack Torcy — Fast Food & Restauration Rapide | O'Snack",
    description:
      "O'Snack, snack fast food au cœur de Torcy (77200) : burgers maison, sandwichs au four, crêpes et milkshakes. À emporter, sur place ou en livraison 7j/7.",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: "Burger maison O'Snack — snack fast food à Torcy, 57 Rue de Paris",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Snack Torcy — Fast Food & Restauration Rapide | O'Snack",
    description:
      "Snack et restauration rapide à Torcy (77200). Burgers, sandwichs au four, crêpes — à emporter ou en livraison, 7j/7.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: {
    telephone: true,
    address: true,
  },
  other: {
    'geo.region': 'FR-77',
    'geo.placename': 'Torcy',
    'geo.position': `${GEO.latitude};${GEO.longitude}`,
    ICBM: `${GEO.latitude}, ${GEO.longitude}`,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Graphe JSON-LD : FastFoodRestaurant (fiche locale complète) + WebSite.
  const jsonLd = siteJsonLd();

  return (
    <html lang="fr">
      <head>
        {/* Favicon servi depuis /public (icône SVG légère) */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" sizes="any" />
        {/* LCP : préchargement du visuel du hero (variante mobile / desktop) */}
        <link
          rel="preload"
          as="image"
          href="/hero-mobile.webp"
          media="(max-width: 767px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/hero-desktop.webp"
          media="(min-width: 768px)"
          fetchPriority="high"
        />
        {/* Données structurées Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${montserrat.variable} ${ibmPlexMono.variable}`}>
        {/* SVG defs for the half-star gradient fill */}
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
          <defs>
            <linearGradient id="half-fill" x1="0" x2="1" y1="0" y2="0">
              <stop offset="50%" stopColor="#fff" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
            </linearGradient>
            {/* Variante dorée pour les étoiles sur fond blanc (cartes d'avis) */}
            <linearGradient id="half-fill-gold" x1="0" x2="1" y1="0" y2="0">
              <stop offset="50%" stopColor="#F5A623" />
              <stop offset="50%" stopColor="rgba(0,0,0,0.14)" />
            </linearGradient>
          </defs>
        </svg>

        <AuthProvider>
          <CartProvider>
            <SmoothScrollProvider>
              <ParticleFieldClient />
              {children}
            </SmoothScrollProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
