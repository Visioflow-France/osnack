import type { Metadata } from 'next';
import { FloatingNav } from '@/components/FloatingNav';
import { Menu } from '@/components/Menu';
import { Footer } from '@/components/Footer';
import { getMenu } from '@/lib/menuDoc';
import { breadcrumbJsonLd, menuJsonLd } from '@/lib/schema';
import { absoluteUrl } from '@/lib/site';

// ── SEO local : « carte », « menu », « snack/fast food Torcy » + prix.
export const metadata: Metadata = {
  title: 'Carte & Menus du Snack',
  description:
    "La carte complète du snack O'Snack à Torcy (77200) : sandwichs au four, burgers classiques et gourmets, menus, crêpes maison, tex-mex, desserts et milkshakes. Restauration rapide à emporter ou en livraison.",
  alternates: {
    canonical: '/carte',
  },
  openGraph: {
    title: "Carte du snack O'Snack — burgers, sandwichs, crêpes à Torcy",
    description:
      "Découvrez toute la carte du fast food O'Snack Torcy : burgers gourmets, sandwichs au four, menus, crêpes et milkshakes. À emporter ou en livraison.",
    url: absoluteUrl('/carte'),
  },
};

// ISR : la page (et donc la lecture Firestore) est revalidée toutes les 5 min.
export const revalidate = 300; // = MENU_REVALIDATE_SECONDS (littéral requis)

export default async function CartePage() {
  const products = await getMenu();

  // Données structurées : carte (Menu + sections + prix) et fil d'Ariane.
  const menuSchema = menuJsonLd();
  const breadcrumb = breadcrumbJsonLd([
    { name: 'La Carte', path: '/carte' },
  ]);

  return (
    <>
      {/* JSON-LD rendus dans le flux de la page (lus par Google, corps ou
          <head> indifféremment — pas de <head> manuel en App Router). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <FloatingNav />
      <main>
        {/* Menu servi par le cache ISR : plus aucun fetch client de rattrapage. */}
        <Menu initialProducts={products} />
      </main>
      <Footer />
    </>
  );
}
