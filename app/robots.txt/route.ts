import { SITE_URL } from '@/lib/site';

/**
 * Route /robots.txt — servie par un Route Handler classique (et non la
 * convention app/robots.ts) car le loader des « metadata routes » de Next
 * ne supporte pas l'apostrophe du chemin projet « o'snack ».
 *
 * - Autorise l'indexation de tout le site public.
 * - Bloque les zones sans valeur de recherche : admin, comptes, API.
 * - Renvoie l'URL du sitemap (domaine placeholder → lib/site.ts).
 */
export function GET(): Response {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /compte',
    'Disallow: /api/',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
