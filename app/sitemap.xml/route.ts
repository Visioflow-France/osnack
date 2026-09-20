import { SITEMAP_PAGES, absoluteUrl } from '@/lib/site';

/**
 * Route /sitemap.xml — servie par un Route Handler classique (et non la
 * convention app/sitemap.ts) car le loader des « metadata routes » de Next
 * ne supporte pas l'apostrophe du chemin projet « o'snack ».
 *
 * Chaque entrée provient de SITEMAP_PAGES (lib/site.ts) — le domaine est le
 * placeholder centralisé, remplaçable via NEXT_PUBLIC_SITE_URL.
 * /admin, /compte et /api sont volontairement exclus (cf. robots.txt).
 */
export function GET(): Response {
  const today = new Date().toISOString().slice(0, 10);

  const urls = SITEMAP_PAGES.map(
    (page) =>
      `  <url>\n` +
      `    <loc>${absoluteUrl(page.path)}</loc>\n` +
      `    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>${page.changeFrequency}</changefreq>\n` +
      `    <priority>${page.priority.toFixed(1)}</priority>\n` +
      `  </url>`,
  ).join('\n');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
