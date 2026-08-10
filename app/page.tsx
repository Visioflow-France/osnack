import { FloatingNav } from '@/components/FloatingNav';
import { Hero } from '@/components/Hero';
import { Marquee } from '@/components/Marquee';
import { Story } from '@/components/Story';
import { BestSellers } from '@/components/BestSellers';
import { Reviews } from '@/components/Reviews';
import { Footer } from '@/components/Footer';
import { getGoogleReviews } from '@/lib/google-reviews';

// Les avis Google sont récupérés côté serveur et mis en cache (ISR) 1 h.
export const revalidate = 3600;

export default async function Home() {
  const reviewsData = await getGoogleReviews();

  return (
    <>
      <FloatingNav />
      <main>
        <Hero />
        <Marquee />
        <Story />
        <BestSellers />
        <Reviews data={reviewsData} />
      </main>
      <Footer />
    </>
  );
}
