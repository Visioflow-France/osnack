import type { Metadata } from 'next';
import { FloatingNav } from '@/components/FloatingNav';
import { Footer } from '@/components/Footer';
import { CheckoutApp } from '@/components/checkout/CheckoutApp';

export const metadata: Metadata = {
  title: "Commander en ligne — paiement au retrait | O'Snack Torcy",
  description:
    "Commandez vos sandwichs, burgers et crêpes O'Snack en ligne et payez au retrait en boutique (espèces ou carte). Retrait dès que possible ou à l'heure de votre choix.",
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
