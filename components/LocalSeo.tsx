import Link from 'next/link';
import { LINKS } from '@/lib/links';
import { SERVICE_AREAS } from '@/lib/site';

/**
 * ── Section contenu local SEO (accueil) ──────────────────────────────────────
 *
 * Composant serveur (0 JS client) : texte ciblé « snack Torcy », « fast food
 * Torcy », « restauration rapide Torcy » + cocon sémantique local (Bay 2,
 * gare de Torcy, RER A, Marne-la-Vallée…). Structuré en H2/H3 conformes à la
 * hiérarchie : un seul H1 sur la page (hero), H2 de section, H3 détaillés.
 */
export function LocalSeo() {
  return (
    <section className="local-seo section-pad" id="torcy">
      <div className="container">
        <p className="section-label">Snack · Fast Food · Torcy</p>
        <h2 className="section-title local-seo-title">
          Votre snack fast food
          <br />
          au cœur de Torcy.
        </h2>
        <p className="local-seo-intro">
          <strong>O&apos;Snack</strong> est le snack de Torcy où la{' '}
          <strong>restauration rapide</strong> rime avec fait maison. Situé{' '}
          <strong>57 Rue de Paris à Torcy (77200)</strong>, à deux pas du centre
          commercial <strong>Bay 2</strong> et de la <strong>gare de Torcy</strong>{' '}
          (RER A, ligne Marne-la-Vallée), notre restaurant rapide vous accueille{' '}
          <strong>7 jours sur 7</strong>, le midi comme le soir. Burgers gourmets,
          sandwichs au four, crêpes maison, tex-mex à partager : tout est préparé
          minute, <strong>à emporter</strong>, sur place ou en{' '}
          <strong>livraison à Torcy</strong> et dans toute la Marne-la-Vallée.
        </p>

        <div className="local-seo-grid">
          <article className="local-seo-block">
            <h3>La carte d&apos;un snack généreux</h3>
            <p>
              Notre carte de <strong>restauration rapide à Torcy</strong> couvre
              toutes les envies : sandwichs grecs et escalopes grillés au four,
              burgers du Cheese au Double Original 180&nbsp;g, menus à prix doux,
              crêpes salées et sucrées, nuggets, tenders, desserts maison et
              milkshakes onctueux. De quoi déjeuner ou dîner vite — et bien.
            </p>
            <Link href="/carte" className="local-seo-link" data-cursor-hover>
              Découvrir la carte du snack <span className="btn-arrow">→</span>
            </Link>
          </article>

          <article className="local-seo-block">
            <h3>Horaires d&apos;ouverture 7j/7</h3>
            <p>
              Ouvert tous les jours, midi et soir :{' '}
              <strong>11h30 – 14h30</strong> et <strong>18h00 – 01h00</strong>.
              Le restaurant rapide idéal pour une pause déjeuner près de Bay 2,
              un dîner après le travail ou une petite faim tardive à Torcy.
              Appelez au {LINKS.phone} ou commandez en ligne en 2 minutes.
            </p>
            <a href={LINKS.phoneHref} className="local-seo-link" data-cursor-hover>
              Appeler le snack <span className="btn-arrow">→</span>
            </a>
          </article>

          <article className="local-seo-block">
            <h3>Livraison à Torcy &amp; retrait en boutique</h3>
            <p>
              Commandez <strong>en ligne</strong> (paiement au retrait, espèces
              ou carte), sur <strong>Uber Eats</strong> ou{' '}
              <strong>Deliveroo</strong> pour la <strong>livraison à Torcy</strong>{' '}
              et les communes voisines : {SERVICE_AREAS.slice(1, 6).join(', ')}…
              Retrait dès 20 minutes à la boutique.
            </p>
            <Link href="/commander" className="local-seo-link" data-cursor-hover>
              Commander en ligne <span className="btn-arrow">→</span>
            </Link>
          </article>

          <article className="local-seo-block">
            <h3>Où nous trouver à Torcy&nbsp;?</h3>
            <p>
              <strong>57 Rue de Paris, 77200 Torcy</strong> — en face des
              axes du centre-ville, à quelques minutes du centre commercial{' '}
              <strong>Bay 2</strong>, de la <strong>gare de Torcy</strong> (RER A)
              et de l&apos;A104. Snack idéal pour les habitants de Torcy, les
              voyageurs de la gare et les équipes du Val Maubuée.
            </p>
            <a
              href={LINKS.addressQuery}
              target="_blank"
              rel="noreferrer"
              className="local-seo-link"
              data-cursor-hover
            >
              Itinéraire Google Maps <span className="btn-arrow">→</span>
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
