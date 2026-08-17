import { FloatingNav } from '@/components/FloatingNav';
import { Hero } from '@/components/Hero';
import { NewsCarousel } from '@/components/NewsCarousel';
import { Marquee } from '@/components/Marquee';
import { Story } from '@/components/Story';
import { Services } from '@/components/Services';
import { BestSellers } from '@/components/BestSellers';
import { Classics } from '@/components/Classics';
import { Reviews } from '@/components/Reviews';
import { OrderBanner } from '@/components/OrderBanner';
import { Footer } from '@/components/Footer';
import { getGoogleReviews } from '@/lib/google-reviews';

// Les avis Google sont récupérés côté serveur et mis en cache (ISR) 1 h.
export const revalidate = 3600;

/**
 * Page d'accueil organisée à la manière de burgerking.fr :
 *  1. Hero plein écran (identité O'Snack)
 *  2. Carrousel « L'actualité O'Snack » (équivalent carrousel promo BK)
 *  3. Marquee (séparateur animé)
 *  4. Story « Le Concept »
 *  5. Services « Choisissez comment commander » (équiv. tuiles BK)
 *  6. « Sélectionné pour vous » — carrousel horizontal de plats
 *  7. « Découvrez nos classiques » + CTA vers la carte
 *  8. Avis Google
 *  9. Bandeau final « Commander » (équiv. bloc app BK)
 */
export default async function Home() {
  const reviewsData = await getGoogleReviews();

  return (
    <>
      <FloatingNav />
      <main>
        <Hero />
        <NewsCarousel />
        <Marquee />
        <Story />
        <Services />
        <BestSellers />
        <Classics />
        <Reviews data={reviewsData} />
        <OrderBanner />
      </main>
      <Footer />
    </>
  );
}
