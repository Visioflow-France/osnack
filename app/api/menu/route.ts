import { NextResponse } from 'next/server';
import { getMenu } from '@/lib/menuDoc';

/**
 * GET /api/menu — menu public en UN document.
 *
 * Grâce à `revalidate` (stale-while-revalidate), les visiteurs servent le
 * cache serveur : au plus une lecture Firestore toutes les 300 s, quelle que
 * soit la fréquentation. Fallback : le menu statique embarqué est renvoyé
 * si Firestore est indisponible.
 */
export const revalidate = 300; // = MENU_REVALIDATE_SECONDS (littéral requis)
export const dynamic = 'force-static';

export async function GET() {
  const items = await getMenu();
  return NextResponse.json(
    { items, updatedAt: Date.now() },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
