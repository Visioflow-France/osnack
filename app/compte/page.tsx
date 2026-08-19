import type { Metadata } from 'next';
import { FloatingNav } from '@/components/FloatingNav';
import { AccountApp } from '@/components/AccountApp';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: "Mon compte fidélité — O'Snack Torcy",
  description:
    "Consultez vos points fidélité O'Snack, échangez-les contre des cadeaux de la carte et suivez vos paliers.",
};

export default function ComptePage() {
  return (
    <>
      <FloatingNav />
      <main>
        <AccountApp />
      </main>
      <Footer />
    </>
  );
}
