// Récupère les VRAIS avis Google via l'API Google Places (v1).
// ⚠️ Côté serveur uniquement : la clé API ne doit JAMAIS être exposée au client.
// Ce module est importé par un Server Component (app/page.tsx) ; grâce au
// `next: { revalidate }` les avis sont mis en cache (ISR) et rafraîchis toutes
// les heures, sans surcharger l'API Google.

export interface GoogleReview {
  id: string;
  name: string;
  /** Description relative fournie par Google, ex. « il y a 3 mois ». */
  date: string;
  rating: number; // 1..5
  text: string;
  /** Lien profil de l'auteur (attribution requise par Google). */
  authorUri?: string;
  /** Photo de profil de l'auteur (si disponible). */
  photoUri?: string;
}

export interface GoogleReviewsData {
  displayName: string;
  rating: number; // note moyenne, ex. 4.5
  total: number; // nombre total d'avis Google
  /** Lien vers la fiche Google pour « voir tous les avis ». */
  url: string;
  reviews: GoogleReview[];
}

// Type partiel de la réponse Places API (champs demandés via le field mask).
interface PlacesPlace {
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  reviews?: PlacesReview[];
}
interface PlacesReview {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: { text?: string };
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
}

const PLACE_ID = process.env.GOOGLE_PLACES_PLACE_ID;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

/** Indique si l'intégration Google Places est configurée (clé + Place ID). */
export function isGoogleReviewsConfigured(): boolean {
  return Boolean(PLACE_ID && API_KEY);
}

/**
 * Récupère les avis Google.
 * @returns les données formatées, ou `null` si non configuré / erreur réseau.
 *          Le composant affiche alors un état de secours honnête (jamais d'avis
 *          inventés).
 */
export async function getGoogleReviews(): Promise<GoogleReviewsData | null> {
  if (!PLACE_ID || !API_KEY) return null;

  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(PLACE_ID)}`;
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // cache 1 h (ISR)
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask':
          'displayName,rating,userRatingCount,reviews(relativePublishTimeDescription,rating,text,authorAttribution)',
        'Accept-Language': 'fr',
      },
    });

    if (!res.ok) {
      console.warn(`[google-reviews] Places API a répondu ${res.status} ${res.statusText}`);
      return null;
    }

    const data = (await res.json()) as PlacesPlace;

    const reviews: GoogleReview[] = (data.reviews ?? [])
      .filter((r) => r?.text?.text)
      .map((r, i) => ({
        id: r.name ?? `gr-${i}`,
        name: r.authorAttribution?.displayName ?? 'Client Google',
        date: r.relativePublishTimeDescription ?? '',
        rating: typeof r.rating === 'number' ? r.rating : 0,
        text: r.text?.text ?? '',
        authorUri: r.authorAttribution?.uri,
        photoUri: r.authorAttribution?.photoUri,
      }));

    return {
      displayName: data.displayName?.text ?? "O'Snack",
      rating: typeof data.rating === 'number' ? data.rating : 0,
      total: typeof data.userRatingCount === 'number' ? data.userRatingCount : 0,
      url: `https://search.google.com/local/reviews?placeid=${encodeURIComponent(PLACE_ID)}`,
      reviews,
    };
  } catch (err) {
    console.warn('[google-reviews] échec de la récupération :', err);
    return null;
  }
}
