import Link from 'next/link';
import { CITY_LANDINGS } from '@/lib/cities';

/**
 * ── Section accueil : « Fast food autour de Torcy » ──────────────────────────
 *
 * Maillage interne vers les pages villes (lib/cities.ts) : chaque page ville
 * reçoit un lien descriptif depuis l'accueil (ancres riches « Fast food
 * Noisiel », « Snack & burger à Lognes »…), complément du footer sitewide.
 * Composant serveur : 0 JS client.
 */
export function CitiesGrid() {
  return (
    <section className="cities-grid-section section-pad" id="villes">
      <div className="container">
        <p className="section-label">Zones desservies · Val Maubuée</p>
        <h2 className="city-section-title cities-grid-title">
          Fast food autour
          <br />
          de Torcy.
        </h2>
        <p className="cities-grid-intro">
          Installés au 57 Rue de Paris à <strong>Torcy</strong>, nous régalons
          aussi les gourmands des communes voisines du Val Maubuée —{' '}
          <strong>à quelques minutes en voiture ou en RER A</strong>, en{' '}
          <strong>livraison</strong> ou en retrait express. Découvrez votre
          page snack de quartier :
        </p>
        <div className="cities-grid">
          {CITY_LANDINGS.map((city) => (
            <article className="cities-card" key={city.slug}>
              <h3>
                Fast food {city.name} ({city.postalCode})
              </h3>
              <p>{city.teaser}</p>
              <Link
                href={city.path}
                className="cities-card-link"
                data-cursor-hover
              >
                Snack &amp; burger à {city.name} <span className="btn-arrow">→</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
