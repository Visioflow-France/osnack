import type { Metadata } from 'next';
import { FloatingNav } from '@/components/FloatingNav';
import { Footer } from '@/components/Footer';
import { AccountApp } from '@/components/account/AccountApp';

export const metadata: Metadata = {
  title: "Mon compte fidélité — O'Snack Torcy",
  description:
    "Connecte-toi à ton espace client O'Snack pour suivre tes points de fidélité et leurs remises.",
  robots: { index: false, follow: false },
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
