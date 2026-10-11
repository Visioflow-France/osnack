import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { LINKS } from './links';

/**
 * ── Liens externes éditables depuis l'admin ─────────────────────────────────
 *
 * Un document unique `site_settings/links` contient les URL des réseaux
 * sociaux et des plateformes de commande. Le site souscrit en temps réel
 * (pattern home_slides) et fusionne sur les valeurs par défaut de
 * lib/links.ts : la collection peut être vide ou partielle, le site reste
 * toujours complet.
 */

/** Collection + id du document des réglages du site. */
export const SITE_SETTINGS_COLLECTION = 'site_settings';
export const SITE_LINKS_DOC_ID = 'links';

/** Liens éditables dans l'admin (onglet « Liens & réseaux »). */
export interface SiteLinks {
  instagram: string;
  facebook: string;
  tiktok: string;
  twitter: string;
  snapchat: string;
  uberEats: string;
  deliveroo: string;
}

/** Valeurs par défaut = lib/links.ts (source unique). */
export const DEFAULT_SITE_LINKS: SiteLinks = {
  instagram: LINKS.instagram,
  facebook: LINKS.facebook,
  tiktok: LINKS.tiktok,
  twitter: LINKS.twitter,
  snapchat: LINKS.snapchat,
  uberEats: LINKS.uberEats,
  deliveroo: LINKS.deliveroo,
};

/** Métadonnées d'affichage des champs (formulaire admin). */
export const SITE_LINK_FIELDS: {
  key: keyof SiteLinks;
  label: string;
  placeholder: string;
}[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/…' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/…' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@…' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/…' },
  { key: 'snapchat', label: 'Snapchat', placeholder: 'https://www.snapchat.com/…' },
  { key: 'uberEats', label: 'Uber Eats', placeholder: 'https://www.ubereats.com/…' },
  { key: 'deliveroo', label: 'Deliveroo', placeholder: 'https://deliveroo.fr/…' },
];

const siteLinksDocRef = () =>
  db ? doc(db, SITE_SETTINGS_COLLECTION, SITE_LINKS_DOC_ID) : null;

/**
 * Souscription temps réel aux liens : fusion des overrides Firestore sur les
 * défauts. Un champ absent ou vide dans Firestore retombe sur sa valeur par
 * défaut — le site ne casse jamais.
 */
export function subscribeToSiteLinks(cb: (links: SiteLinks) => void): () => void {
  const ref = siteLinksDocRef();
  if (!isFirebaseConfigured || !ref) {
    cb(DEFAULT_SITE_LINKS);
    return () => {};
  }

  return onSnapshot(
    ref,
    (snap) => {
      const data = snap.exists() ? (snap.data() as Partial<SiteLinks>) : {};
      const merged = { ...DEFAULT_SITE_LINKS };
      for (const field of SITE_LINK_FIELDS) {
        const value = data[field.key];
        if (typeof value === 'string' && value.trim()) {
          merged[field.key] = value.trim();
        }
      }
      cb(merged);
    },
    (err) => {
      console.error('[site-links] subscribe failed, falling back to defaults:', err);
      cb(DEFAULT_SITE_LINKS);
    },
  );
}

/**
 * Enregistre les liens modifiés (dashboard admin). Seuls les champs remplis
 * sont écrits : un champ laissé vide retombe sur sa valeur par défaut.
 */
export async function saveSiteLinks(
  patch: Partial<Record<keyof SiteLinks, string>>,
): Promise<void> {
  const ref = siteLinksDocRef();
  if (!ref) throw new Error('Firebase non configuré');
  const clean: Partial<Record<keyof SiteLinks, string>> = {};
  for (const field of SITE_LINK_FIELDS) {
    const value = patch[field.key];
    if (typeof value === 'string' && value.trim()) clean[field.key] = value.trim();
  }
  await setDoc(ref, clean, { merge: true });
}

/** Supprime l'override d'un champ (retour à la valeur par défaut du code). */
export async function resetSiteLink(key: keyof SiteLinks): Promise<void> {
  const ref = siteLinksDocRef();
  if (!ref) throw new Error('Firebase non configuré');
  await setDoc(ref, { [key]: '' }, { merge: true });
}
