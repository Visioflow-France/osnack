import type { Metadata } from 'next';
import { FloatingNav } from '@/components/FloatingNav';
import { History } from '@/components/History';
import { Footer } from '@/components/Footer';
import { absoluteUrl } from '@/lib/site';

// ── SEO : ancrage sémantique « fast food / restauration rapide » via
// l'histoire de la street-food, reliée au snack d'aujourd'hui à Torcy.
export const metadata: Metadata = {
  title: "L'Histoire du Fast Food et de la Street Food",
  description:
    "Deux mille ans d'histoire de la restauration rapide, des thermopolia romains au burger gourmet — et le savoir-faire fait maison du snack O'Snack Torcy (77200).",
  alternates: {
    canonical: '/histoire',
  },
  openGraph: {
    title: "L'Histoire du Fast Food — O'Snack Torcy",
    description:
      "Des thermopolia romains au burger gourmet d'aujourd'hui : l'histoire de la street-food et du fast food, racontée par O'Snack Torcy.",
    url: absoluteUrl('/histoire'),
  },
};

export default function HistoirePage() {
  return (
    <>
      <FloatingNav />
      <main>
        <History />
      </main>
      <Footer />
    </>
  );
}
