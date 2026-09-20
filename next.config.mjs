/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance & sécurité : ne pas annoncer la stack (en-tête X-Powered-By).
  poweredByHeader: false,

  // Compression gzip/brotli des réponses (défaut Next, explicite ici).
  compress: true,

  images: {
    // Admin can paste any image URL in the dashboard, so allow all https hosts.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    // Formats modernes négociés par le <Image> de Next (WebP/AVIF).
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    const cacheImmutable = [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ];
    return [
      // Images statiques du dossier public : cache navigateur immuable
      // (les noms de fichiers changent quand les visuels changent).
      { source: '/hero-mobile.webp', headers: cacheImmutable },
      { source: '/hero-desktop.webp', headers: cacheImmutable },
      { source: '/hero-burger.png', headers: cacheImmutable },
      { source: '/og-image.jpg', headers: cacheImmutable },
    ];
  },
};

export default nextConfig;
