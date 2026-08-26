import type { Metadata } from 'next';
import { Montserrat, Inter, IBM_Plex_Mono } from 'next/font/google';
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { ParticleFieldClient } from '@/components/ParticleFieldClient';
import { AuthProvider } from '@/components/AuthContext';
import { CartProvider } from '@/components/CartContext';
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

export const metadata: Metadata = {
  title: "O'Snack Torcy — Sandwichs au four & Burgers gourmands",
  description:
    "O'Snack Torcy — Sandwichs au four & Burgers gourmands au cœur de Torcy. 57 Rue de Paris, 77220 Torcy. Ouvert 7j/7.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
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
