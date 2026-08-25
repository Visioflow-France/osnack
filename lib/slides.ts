import { collection, doc, onSnapshot, query, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { Filter } from './menu';

/** Firestore collection des slides du carrousel de catégories (accueil). */
export const SLIDES_COLLECTION = 'home_slides';

export interface CategorySlide {
  /**
   * Clé stable du slide = filtre de la carte visé par le bouton « Découvrir »
   * (ex. `crepes-salees` → `/carte?cat=crepes-salees`). Non modifiable :
   * c'est ce qui lie chaque slide à sa catégorie de la carte.
   */
  id: Filter;
  /** Titre affiché sur l'image (éditable dans l'admin). */
  title: string;
  /** Image de fond (éditable dans l'admin). */
  image: string;
}

const img = (id: string): string =>
  `https://images.unsplash.com/photo-${id}?w=1600&auto=format&fit=crop&q=80`;

// Slides par défaut (images Unsplash vérifiées, reprises du reste du site).
// Servis immédiatement (SSR sans Firebase) puis fusionnés avec Firestore.
export const DEFAULT_SLIDES: CategorySlide[] = [
  { id: 'sandwichs', title: 'Nos Menus Sandwich', image: img('1555939594-58d7cb561ad1') },
  { id: 'burgers', title: 'Nos Menus Burgers', image: img('1568901346375-23c9450c58cd') },
  { id: 'texmex', title: 'Nos Menus Tex Mex', image: img('1626645738196-c2a7c87a8f58') },
  { id: 'crepes-salees', title: 'Nos Crêpes Salées', image: img('1519676892522-1d60b5f5c7c3') },
  { id: 'crepes-sucrees', title: 'Nos Crêpes Sucrées', image: img('1601050690597-df0568f70950') },
  { id: 'desserts-boissons', title: 'Nos Desserts/Boissons', image: img('1546173159-315724a31696') },
];

/**
 * Subscribe aux slides en temps réel. Les documents Firestore (un par slide,
 * keyés par id) sont fusionnés sur les défauts : la collection peut être vide
 * ou partielle, le site reste toujours complet.
 */
export function subscribeToSlides(cb: (slides: CategorySlide[]) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    cb(DEFAULT_SLIDES);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, SLIDES_COLLECTION)),
    (snap) => {
      const byId = new Map(
        snap.docs.map((d) => [d.id, d.data() as Partial<CategorySlide>] as const),
      );
      cb(
        DEFAULT_SLIDES.map((slide) => ({
          ...slide,
          ...byId.get(slide.id),
          id: slide.id, // l'id ne se modifie jamais
        })),
      );
    },
    (err) => {
      console.error('[slides] subscribe failed, falling back to defaults:', err);
      cb(DEFAULT_SLIDES);
    },
  );
}

/** Modifier le titre et/ou l'image d'un slide (côté dashboard admin). */
export async function updateSlide(
  id: string,
  patch: Partial<Pick<CategorySlide, 'title' | 'image'>>,
): Promise<void> {
  if (!db) throw new Error('Firebase non configuré');
  await setDoc(doc(db, SLIDES_COLLECTION, id), patch, { merge: true });
}
