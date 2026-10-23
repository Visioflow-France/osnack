import { CityPageView, cityMetadata } from '@/components/CityPageView';
import { cityBySlug } from '@/lib/cities';

/**
 * Page d'atterrissage locale « Fast Food Lognes » (77185).
 * Contenu et métadonnées : lib/cities.ts (slug « lognes ») — le rendu est
 * partagé via components/CityPageView.tsx.
 */
const city = cityBySlug('lognes')!;

export const metadata = cityMetadata(city);

export default function FastFoodLognesPage() {
  return <CityPageView city={city} />;
}
