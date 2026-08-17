import { FloatingNav } from '@/components/FloatingNav';
import { Hero } from '@/components/Hero';
import { NewsCarousel } from '@/components/NewsCarousel';
import { LoyaltyBanner } from '@/components/LoyaltyBanner';
import { Classics } from '@/components/Classics';
import { Footer } from '@/components/Footer';

// La page d'accueil suit la structure demandée :
//  1. Hero plein écran (identité O'Snack)
//  2. « L'actualité O'Snack » (carrousel, équiv. BK)
//  3. Bannière fidélité (gabarit du bloc « offres exclusives » BK) :
//     points cumulés à chaque commande + compte client
//  4. « Découvrez nos classiques » (plats, équiv. BK)
//  5. Mentions légales & contact (footer)
export default function Home() {
  return (
    <>
      <FloatingNav />
      <main>
        <Hero />
        <NewsCarousel />
        <LoyaltyBanner />
        <Classics />
      </main>
      <Footer />
    </>
  );
}
