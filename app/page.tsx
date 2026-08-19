import { FloatingNav } from '@/components/FloatingNav';
import { Hero } from '@/components/Hero';
import { NewsCarousel } from '@/components/NewsCarousel';
import { LoyaltyBanner } from '@/components/LoyaltyBanner';
import { Classics } from '@/components/Classics';
import { Footer } from '@/components/Footer';
import { getMenu } from '@/lib/menuDoc';

// La page d'accueil suit la structure demandée :
//  1. Hero plein écran (identité O'Snack)
//  2. « L'actualité O'Snack » (carrousel, équiv. BK)
//  3. Bannière fidélité (gabarit du bloc « offres exclusives » BK) :
//     points cumulés à chaque commande + compte client
//  4. « Découvrez nos classiques » (plats, équiv. BK)
//  5. Mentions légales & contact (footer)
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
        <NewsCarousel />
        <LoyaltyBanner />
        <Classics initialProducts={products} />
      </main>
      <Footer />
    </>
  );
}
