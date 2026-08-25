import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { db, isFirebaseConfigured } from './firebase';

/**
 * ── Firebase Storage optimisé forfait gratuit ────────────────────────────────
 *
 * 1. Compression WebP côté client AVANT upload : max 800 px de large,
 *    qualité 80 %, avec réduction de qualité progressive jusqu'à rester
 *    sous ~150 Ko (limre haut du cahier des charges : 100–150 Ko).
 * 2. Suppression de l'ancienne image via deleteObject() quand on remplace
 *    la photo d'un plat (ou quand on supprime le plat).
 *
 * Le téléchargement public des images est gratuit (download via URL publique
 * https) ; ce sont les opérations d'upload/delete qui sont comptées — d'où
 * un nettoyage systématique pour éviter les fichiers orphelins.
 */

/** Largeur maximale en pixels. */
const MAX_WIDTH = 800;
/** Qualité WebP de départ. */
const QUALITY_START = 0.8;
/** Qualité minimale acceptable avant de rendre la main. */
const QUALITY_MIN = 0.45;
/** Poids cible en octets (~147 Ko). */
const MAX_BYTES = 150 * 1024;

export const isFirebaseStorageConfigured = () =>
  isFirebaseConfigured && Boolean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

/**
 * Vrai si une URL pointe vers notre bucket Firebase Storage
 * (seules ces images peuvent/doi­vent être supprimées côté serveur Storage).
 */
export function isFirebaseStorageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const u = new URL(url);
    return (
      (u.hostname === 'firebasestorage.googleapis.com' ||
        u.hostname === 'storage.googleapis.com') &&
      (!bucket || u.pathname.includes(`/${bucket}/`))
    );
  } catch {
    return false;
  }
}

/** Extrait le chemin objet ("dishes/grec.webp") d'une URL Storage publique. */
export function storagePathFromUrl(url: string): string | null {
  if (!isFirebaseStorageUrl(url)) return null;
  try {
    const u = new URL(url);
    // Format : /v0/b/<bucket>/o/<encoded-path>?token=…
    const m = u.pathname.match(/\/o\/(.+)$/);
    if (!m) return null;
    return decodeURIComponent(m[1].split('?')[0]);
  } catch {
    return null;
  }
}

/** Génère un nom de fichier stable et sûr pour un plat. */
function objectName(productId: string): string {
  const slug = productId
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'plat';
  return `dishes/${slug}.webp`;
}

/**
 * Compresse un fichier image en WebP via <canvas> (côté navigateur uniquement).
 * - redimensionne à MAX_WIDTH max (conserve le ratio) ;
 * - essaie qualité 0.8 puis descend par pas jusqu'à QUALITY_MIN ;
 * - si le résultat reste trop lourd, réduit la largeur par paliers.
 * Retourne le Blob WebP final (≤ ~150 Ko en pratique).
 */
export async function compressToWebP(file: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const startW = Math.max(1, Math.round(bitmap.width * scale));
  const startH = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible');
  canvas.width = startW;
  canvas.height = startH;
  ctx.drawImage(bitmap, 0, 0, startW, startH);

  let quality = QUALITY_START;
  let blob = await canvasToWebP(canvas, quality);

  // Réduction progressive de qualité, puis de taille, pour respecter le budget.
  while (blob.size > MAX_BYTES && quality > QUALITY_MIN) {
    quality = Math.max(QUALITY_MIN, quality - 0.1);
    blob = await canvasToWebP(canvas, quality);
  }
  while (blob.size > MAX_BYTES && canvas.width > 320) {
    canvas.width = Math.round(canvas.width * 0.85);
    canvas.height = Math.round(canvas.height * 0.85);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    blob = await canvasToWebP(canvas, quality);
  }

  bitmap.close?.();
  return blob;
}

function canvasToWebP(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encodage WebP impossible'))),
      'image/webp',
      quality,
    );
  });
}

/**
 * Compresse puis téléverse l'image d'un plat dans Storage.
 * @returns l'URL publique de téléchargement (getDownloadURL).
 */
export async function uploadDishImage(
  productId: string,
  file: File | Blob,
): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase non configuré');

  const storage = getStorage();
  const webp = await compressToWebP(file);
  const path = objectName(productId);
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, webp, {
    contentType: 'image/webp',
    cacheControl: 'public, max-age=31536000, immutable',
  });
  return getDownloadURL(storageRef);
}

/**
 * Supprime l'objet Storage correspondant à une URL d'image.
 * Silencieux : les erreurs sont loggées mais non bloquantes (image déjà
 * supprimée, URL externe type Unsplash, réseau coupé…).
 */
export async function deleteDishImageByUrl(url?: string | null): Promise<void> {
  const path = storagePathFromUrl(url ?? '');
  if (!path) return;
  try {
    await deleteObject(ref(getStorage(), path));
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'storage/object-not-found') return; // déjà nettoyée
    console.warn('[storage] suppression impossible :', err);
  }
}
