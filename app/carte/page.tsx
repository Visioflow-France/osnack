import type { Metadata } from 'next';
import { FloatingNav } from '@/components/FloatingNav';
import { Menu } from '@/components/Menu';
import { Footer } from '@/components/Footer';
import { getMenu } from '@/lib/menuDoc';

export const metadata: Metadata = {
  title: "La Carte — O'Snack Torcy",
  description:
    "Toute la carte d'O'Snack Torcy : sandwichs au four, burgers classiques et gourmets, menus, crêpes, tex-mex, desserts et milkshakes maison. 57 Rue de Paris, 77220 Torcy.",
};

// ISR : la page (et donc la lecture Firestore) est revalidée toutes les 5 min.
export const revalidate = 300; // = MENU_REVALIDATE_SECONDS (littéral requis)

export default async function CartePage() {
  const products = await getMenu();
  return (
    <>
      <FloatingNav />
      <main>
        {/* Menu servi par le cache ISR : plus aucun fetch client de rattrapage. */}
        <Menu initialProducts={products} />
      </main>
      <Footer />
    </>
  );
}
