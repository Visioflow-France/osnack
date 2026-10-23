import { CityPageView, cityMetadata } from '@/components/CityPageView';
import { cityBySlug } from '@/lib/cities';

/**
 * Page d'atterrissage locale « Fast Food Collégien » (77090).
 * Contenu et métadonnées : lib/cities.ts (slug « collegien ») — le rendu est
 * partagé via components/CityPageView.tsx.
 */
const city = cityBySlug('collegien')!;

export const metadata = cityMetadata(city);

export default function FastFoodCollegienPage() {
  return <CityPageView city={city} />;
}
