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

// Type partiel de la réponse Place Details (ancienne API, plus fiable pour les avis).
interface PlacesResponse {
  status?: string;
  error_message?: string;
  result?: PlacesPlace;
}
interface PlacesPlace {
  name?: string;
  rating?: number;
  user_ratings_total?: number;
  url?: string;
  reviews?: PlacesReview[];
}
interface PlacesReview {
  author_name?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
  author_url?: string;
  profile_photo_url?: string;
}

const PLACE_ID = process.env.GOOGLE_PLACES_PLACE_ID;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

/** Indique si l'intégration Google Places est configurée (clé + Place ID). */
export function isGoogleReviewsConfigured(): boolean {
  return Boolean(PLACE_ID && API_KEY);
}

/**
 * Récupère les avis Google via l'ancienne API Place Details (plus fiable pour
 * obtenir les avis que Places API v1, qui renvoie souvent un tableau vide).
 * @returns les données formatées, ou `null` si non configuré / erreur réseau.
 *          Le composant affiche alors un état de secours honnête (jamais d'avis
 *          inventés).
 */
export async function getGoogleReviews(): Promise<GoogleReviewsData | null> {
  if (!PLACE_ID || !API_KEY) return null;

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(PLACE_ID)}` +
      `&key=${encodeURIComponent(API_KEY)}` +
      `&language=fr&reviews_sort=newest`;

    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1 h (ISR)

    if (!res.ok) {
      console.warn(`[google-reviews] Place Details a répondu ${res.status} ${res.statusText}`);
      return null;
    }

    const payload = (await res.json()) as PlacesResponse;

    if (payload.status !== 'OK') {
      console.warn(
        `[google-reviews] statut API "${payload.status}"` +
          (payload.error_message ? ` — ${payload.error_message}` : ''),
      );
      return null;
    }

    const data = payload.result;
    if (!data) return null;

    const reviews: GoogleReview[] = (data.reviews ?? [])
      .filter((r) => r?.text)
      .map((r, i) => ({
        id: `${PLACE_ID}-${i}`,
        name: r.author_name ?? 'Client Google',
        date: r.relative_time_description ?? '',
        rating: typeof r.rating === 'number' ? r.rating : 0,
        text: r.text ?? '',
        authorUri: r.author_url,
        photoUri: r.profile_photo_url,
      }));

    return {
      displayName: data.name ?? "O'Snack",
      rating: typeof data.rating === 'number' ? data.rating : 0,
      total: typeof data.user_ratings_total === 'number' ? data.user_ratings_total : 0,
      url:
        data.url ??
        `https://search.google.com/local/reviews?placeid=${encodeURIComponent(PLACE_ID)}`,
      reviews,
    };
  } catch (err) {
    console.warn('[google-reviews] échec de la récupération :', err);
    return null;
  }
}
