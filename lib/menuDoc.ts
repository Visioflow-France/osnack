import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MENU, type Product } from './menu';

/**
 * ── Menu agrégé en UN document Firestore ──────────────────────────────────────
 *
 * Objectif : rester dans le forfait gratuit (Tier Spark, 50 k reads/jour).
 * Le menu complet (~60 plats) vit dans un document unique `menu/vitrine`.
 * Une page publique = 1 read au maximum (via le cache ISR de /api/menu, en
 * pratique bien moins : 1 read toutes les `MENU_REVALIDATE_SECONDS`).
 *
 * L'admin écrit dans ce document à chaque modification (prix, dispo…).
 * La collection historique `products` n'est plus lue par le site public.
 */

/** Collection + id du document agrégé contenant tout le menu. */
export const MENU_DOC_COLLECTION = 'menu';
export const MENU_DOC_ID = 'vitrine';

/** Fraîcheur du cache serveur (ISR / stale-while-revalidate), en secondes. */
export const MENU_REVALIDATE_SECONDS = 300;

interface MenuDocData {
  items: Product[];
  /** Date de dernière écriture (ms epoch) — utile au débogage. */
  updatedAt: number;
}

const menuDocRef = () =>
  db ? doc(db, MENU_DOC_COLLECTION, MENU_DOC_ID) : null;

export const sortMenu = (items: Product[]): Product[] =>
  [...items].sort(
    (a, b) =>
      (a.order ?? 9999) - (b.order ?? 9999) ||
      a.name.localeCompare(b.name, 'fr'),
  );

/**
 * Lit le menu agrégé. Retourne le menu statique embarqué (menu.json de secours)
 * si Firebase n'est pas configuré, si le document n'existe pas encore ou en cas
 * d'erreur réseau temporaire — le site public ne casse jamais.
 */
export async function getMenu(): Promise<Product[]> {
  const ref = menuDocRef();
  if (!ref) return MENU;

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return MENU;
    const data = snap.data() as Partial<MenuDocData>;
    if (!Array.isArray(data.items) || data.items.length === 0) return MENU;
    return sortMenu(data.items);
  } catch (err) {
    console.warn('[menu] lecture Firestore impossible, fallback statique :', err);
    return MENU;
  }
}

/**
 * Écrit le menu agrégé complet (remplace les items). Côté admin uniquement.
 * 1 write = tout le menu à jour pour le site public.
 */
export async function saveMenu(items: Product[]): Promise<void> {
  const ref = menuDocRef();
  if (!ref) throw new Error('Firebase non configuré');
  const data: MenuDocData = { items: sortMenu(items), updatedAt: Date.now() };
  await setDoc(ref, data);
}

/**
 * Applique un patch à UN plat du menu agrégé (prix, dispo, image…).
 * Lit le doc (1 read), modifie, réécrit (1 write). Réservé à l'admin —
 * quelques opérations par jour, sans impact sur le quota.
 */
export async function patchMenuItem(
  id: string,
  patch: Partial<Omit<Product, 'id'>>,
): Promise<Product[]> {
  const items = await getMenu();
  const idx = items.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Plat introuvable : ${id}`);
  const next = [...items];
  next[idx] = { ...next[idx], ...patch, id };
  await saveMenu(next);
  return next;
}

/** Ajoute un plat au menu agrégé (id généré côté client). */
export async function addMenuItem(
  data: Omit<Product, 'id'>,
): Promise<Product[]> {
  const items = await getMenu();
  const id = `p-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  const item: Product = { ...data, id };
  await saveMenu([...items, item]);
  return sortMenu([...items, item]);
}

/** Retire un plat du menu agrégé. Retourne la liste mise à jour. */
export async function removeMenuItem(id: string): Promise<Product[]> {
  const items = await getMenu();
  const next = items.filter((p) => p.id !== id);
  await saveMenu(next);
  return next;
}
