import { CityPageView, cityMetadata } from '@/components/CityPageView';
import { cityBySlug } from '@/lib/cities';

/**
 * Page d'atterrissage locale « Fast Food Noisiel » (77186).
 * Contenu et métadonnées : lib/cities.ts (slug « noisiel ») — le rendu est
 * partagé via components/CityPageView.tsx.
 */
const city = cityBySlug('noisiel')!;

export const metadata = cityMetadata(city);

export default function FastFoodNoisielPage() {
  return <CityPageView city={city} />;
}
