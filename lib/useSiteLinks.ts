'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_SITE_LINKS,
  subscribeToSiteLinks,
  type SiteLinks,
} from './siteSettings';

/**
 * Hook temps réel des liens du site, sur le modèle de `useSlides` : sert les
 * valeurs par défaut immédiatement (SSR-safe), puis passe aux données
 * Firestore dès qu'elles arrivent. Re-render automatique à chaque modif
 * dans l'admin.
 */
export function useSiteLinks() {
  const [links, setLinks] = useState<SiteLinks>(DEFAULT_SITE_LINKS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToSiteLinks((items) => {
      setLinks(items);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { links, loading };
}
