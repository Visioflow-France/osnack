import { FloatingNav } from '@/components/FloatingNav';
import { Hero } from '@/components/Hero';
import { NewsCarousel } from '@/components/NewsCarousel';
import { LoyaltyBanner } from '@/components/LoyaltyBanner';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import { Footer } from '@/components/Footer';

// La page d'accueil suit la structure demandée :
//  1. Hero plein écran (identité O'Snack)
//  2. « L'actualité O'Snack » (carrousel, équiv. BK)
//  3. Bannière fidélité (gabarit du bloc « offres exclusives » BK) :
//     points cumulés à chaque commande + compte client
//  4. Carrousel des catégories de la carte (une image à la fois,
//     bouton « Découvrir » vers la section associée de la carte)
//  5. Mentions légales & contact (footer)
export default function Home() {
  return (
    <>
      <FloatingNav />
      <main>
        <Hero />
        <NewsCarousel />
        <LoyaltyBanner />
        <CategoryCarousel />
      </main>
      <Footer />
    </>
  );
}
