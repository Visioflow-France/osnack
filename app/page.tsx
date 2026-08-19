import { FloatingNav } from '@/components/FloatingNav';
import { Hero } from '@/components/Hero';
import { Marquee } from '@/components/Marquee';
import { Story } from '@/components/Story';
import { BestSellers } from '@/components/BestSellers';
import { Reviews } from '@/components/Reviews';
import { Footer } from '@/components/Footer';
import { getGoogleReviews } from '@/lib/google-reviews';
import { getMenu } from '@/lib/menuDoc';

// Les avis Google sont récupérés côté serveur et mis en cache (ISR) 1 h.
// Le menu est servi depuis le document unique (cache ISR partagé) : 0 lecture
// Firestore côté client.
export const revalidate = 3600;

export default async function Home() {
  const [reviewsData, products] = await Promise.all([
    getGoogleReviews(),
    getMenu(),
  ]);

  return (
    <>
      <FloatingNav />
      <main>
        <Hero />
        <Marquee />
        <Story />
        <BestSellers initialProducts={products} />
        <Reviews data={reviewsData} />
      </main>
      <Footer />
    </>
  );
}
