import type { Metadata } from 'next';
import { FloatingNav } from '@/components/FloatingNav';
import { Footer } from '@/components/Footer';
import { CheckoutApp } from '@/components/checkout/CheckoutApp';
import { absoluteUrl } from '@/lib/site';

// ── SEO local : commande en ligne, retrait, livraison Torcy.
export const metadata: Metadata = {
  title: 'Commander en Ligne — Retrait ou Livraison',
  description:
    "Commandez en ligne chez O'Snack, snack fast food à Torcy (77200) : burgers, sandwichs au four et crêpes préparés minute. Paiement au retrait (espèces ou carte), retrait dès 20 min ou livraison à Torcy.",
  alternates: {
    canonical: '/commander',
  },
  openGraph: {
    title: "Commander en ligne — O'Snack Torcy, paiement au retrait",
    description:
      "Commande en ligne au snack O'Snack Torcy : retrait dès 20 min ou livraison. Paiement en espèces ou par carte au retrait.",
    url: absoluteUrl('/commander'),
  },
};

export default function CommanderPage() {
  return (
    <>
      <FloatingNav />
      <main>
        <CheckoutApp />
      </main>
      <Footer />
    </>
  );
}
