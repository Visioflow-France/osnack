import { FloatingNav } from '@/components/FloatingNav';
import { Hero } from '@/components/Hero';
import { LoyaltyBanner } from '@/components/LoyaltyBanner';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import { Footer } from '@/components/Footer';
import { getMenu } from '@/lib/menuDoc';

// La page d'accueil suit la structure demandée :
//  1. Hero plein écran (identité O'Snack)
//  2. Carrousel des catégories de la carte (une image à la fois,
//     bouton « Découvrir » vers la section associée de la carte)
//  3. Bannière fidélité (gabarit du bloc « offres exclusives » BK) :
//     points cumulés à chaque commande + compte client
//  4. Mentions légales & contact (footer)
//
// ISR : le menu vient du document unique (cache serveur 5 min) — 0 lecture
// Firestore côté client.
export const revalidate = 300;

export default async function Home() {
  const products = await getMenu();
  return (
    <>
      <FloatingNav />
      <main>
        <Hero />
        <CategoryCarousel />
        <LoyaltyBanner />
      </main>
      <Footer />
    </>
  );
}
