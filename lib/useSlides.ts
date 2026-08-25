'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_SLIDES, type CategorySlide } from './slides';
import { subscribeToSlides } from './slides';

/**
 * Real-time slides hook, sur le modèle de `useProducts` : rend les slides par
 * défaut immédiatement (SSR-safe), puis passe aux données Firestore dès
 * qu'elles arrivent. Re-render automatique à chaque modif dans l'admin.
 */
export function useSlides() {
  const [slides, setSlides] = useState<CategorySlide[]>(DEFAULT_SLIDES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToSlides((items) => {
      setSlides(items);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { slides, loading };
}
