import type { Metadata } from 'next';
import { FloatingNav } from '@/components/FloatingNav';
import { Hero } from '@/components/Hero';
import { LoyaltyBanner } from '@/components/LoyaltyBanner';
import { CategoryGrid } from '@/components/CategoryGrid';
import { LocalSeo } from '@/components/LocalSeo';
import { Footer } from '@/components/Footer';
import { getMenu } from '@/lib/menuDoc';
import { absoluteUrl } from '@/lib/site';

// La page d'accueil suit la structure demandée :
//  1. Hero plein écran (identité O'Snack) — H1 unique avec mots-clés locaux
//  2. Grille des catégories de la carte (gabarit osnackparis.fr : toutes
//     les bulles visibles d'un coup, bouton « Découvrir » vers la section
//     associée de la carte)
//  3. Bannière fidélité (gabarit du bloc « offres exclusives » BK) :
//     points cumulés à chaque commande + compte client
//  4. Section contenu local SEO (H2/H3 : carte, horaires, livraison,
//     localisation — cocon sémantique Torcy)
//  5. Mentions légales & contact (footer)
//
// ISR : le menu vient du document unique (cache serveur 5 min) — 0 lecture
// Firestore côté client.
export const revalidate = 300;

// ── SEO local : requêtes cibles « snack Torcy », « fast food Torcy »,
// « restauration rapide Torcy » placées en tête de title et description.
export const metadata: Metadata = {
  title: {
    absolute: 'Snack Torcy — Fast Food & Restauration Rapide 77200 | O’Snack',
  },
  description:
    'Snack et fast food à Torcy : O’Snack, votre restauration rapide au 57 Rue de Paris (77200). Burgers maison, sandwichs au four, crêpes et menus à emporter ou en livraison — ouvert 7j/7.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Snack Torcy — Fast Food & Restauration Rapide | O’Snack',
    description:
      'Le snack de Torcy (77200) : burgers maison, sandwichs au four, crêpes. À emporter, sur place ou en livraison Uber Eats / Deliveroo, 7j/7.',
    url: absoluteUrl('/'),
    type: 'website',
  },
};

export default async function Home() {
  const products = await getMenu();
  return (
    <>
      <FloatingNav />
      <main>
        <Hero />
        <CategoryGrid />
        <LoyaltyBanner />
        <LocalSeo />
      </main>
      <Footer />
    </>
  );
}
