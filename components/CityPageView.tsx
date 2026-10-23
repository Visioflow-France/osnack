import type { Metadata } from 'next';
import Link from 'next/link';
import { FloatingNav } from '@/components/FloatingNav';
import { Footer } from '@/components/Footer';
import { RichText } from '@/components/RichText';
import { CITY_LANDINGS, type CityLanding } from '@/lib/cities';
import { LINKS } from '@/lib/links';
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/schema';
import { absoluteUrl, BUSINESS } from '@/lib/site';

/**
 * ── Vue des pages d'atterrissage locales ─────────────────────────────────────
 *
 * Rendu partagé par les routes plates /fast-food-noisiel, /fast-food-lognes
 * et /fast-food-collegien (l'App Router ne gère pas les segments dynamiques
 * partiels type fast-food-[ville] : chaque ville a son dossier de route).
 *
 * Objectif SEO : requêtes « fast food / snack / burger + ville » autour de
 * Torcy. Contenu 100 % statique et unique par ville (lib/cities.ts), données
 * structurées FAQPage + BreadcrumbList, maillage interne (accueil, footer,
 * pages sœurs) et canonical propre à chaque page.
 */

/** Métadonnées (title, description, canonical, OG) d'une page ville. */
export function cityMetadata(city: CityLanding): Metadata {
  return {
    title: { absolute: city.metaTitle },
    description: city.metaDescription,
    alternates: {
      canonical: city.path,
    },
    openGraph: {
      title: city.metaTitle,
      description: city.metaDescription,
      url: absoluteUrl(city.path),
      type: 'website',
      locale: 'fr_FR',
      // L'openGraph de page remplace celui du layout (merge superficiel) :
      // on repose explicitement l'image de partage et la locale.
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `Burger maison O’Snack — fast food et snack près de ${city.name}`,
        },
      ],
    },
  };
}

export function CityPageView({ city }: { city: CityLanding }) {
  const breadcrumb = breadcrumbJsonLd([
    { name: `Fast food ${city.name}`, path: city.path },
  ]);
  const faq = faqJsonLd(city.faq);
  const otherCities = CITY_LANDINGS.filter((c) => c.slug !== city.slug);

  return (
    <>
      {/* Données structurées : FAQ locale + fil d'Ariane */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <FloatingNav />

      <main className="city-page">
        {/* ── En-tête : fil d'Ariane, H1 unique et intro locale ── */}
        <section className="city-hero section-pad">
          <div className="container">
            <nav className="city-breadcrumb" aria-label="Fil d’Ariane">
              <Link href="/">Accueil</Link>
              <span aria-hidden="true">/</span>
              <span>Fast food {city.name}</span>
            </nav>

            <p className="section-label">{city.label}</p>
            <h1 className="city-h1">{city.h1}</h1>
            <p className="city-intro">
              <RichText text={city.intro} />
            </p>
          </div>
        </section>

        {/* ── Blocs pratiques : itinéraire, carte, livraison, horaires ── */}
        <section className="local-seo section-pad city-blocks">
          <div className="container">
            <div className="local-seo-grid">
              {city.blocks.map((block) => (
                <article className="local-seo-block" key={block.title}>
                  <h2 className="city-block-title">{block.title}</h2>
                  <p>
                    <RichText text={block.body} />
                  </p>
                  {block.action.external ? (
                    <a
                      href={block.action.href}
                      target="_blank"
                      rel="noreferrer"
                      className="local-seo-link"
                      data-cursor-hover
                    >
                      {block.action.label} <span className="btn-arrow">→</span>
                    </a>
                  ) : (
                    <Link
                      href={block.action.href}
                      className="local-seo-link"
                      data-cursor-hover
                    >
                      {block.action.label} <span className="btn-arrow">→</span>
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Localisation : NAP + carte ── */}
        <section className="city-map-section section-pad">
          <div className="container city-map-grid">
            <div className="city-map-infos">
              <p className="section-label">Nous trouver</p>
              <h2 className="city-section-title">
                Au cœur de Torcy,
                <br />
                à quelques minutes de {city.name}.
              </h2>
              <p className="city-map-text">
                <strong>
                  {BUSINESS.streetAddress}, {BUSINESS.postalCode} {BUSINESS.city}
                </strong>{' '}
                — le snack O’Snack est ouvert <strong>7 j/7</strong>, midi et
                soir. Appelez-nous au <strong>{BUSINESS.phone}</strong> ou
                commandez en ligne, votre commande est prête{' '}
                <strong>dès 20 minutes</strong>.
              </p>
              <div className="city-map-ctas">
                <a
                  href={LINKS.addressQuery}
                  target="_blank"
                  rel="noreferrer"
                  className="city-cta"
                  data-cursor-hover
                >
                  Itinéraire depuis {city.name}
                </a>
                <a
                  href={LINKS.phoneHref}
                  className="city-cta city-cta--ghost"
                  data-cursor-hover
                >
                  {BUSINESS.phone}
                </a>
              </div>
            </div>
            <div className="city-map">
              <iframe
                title={`Localisation du snack O’Snack à Torcy, près de ${city.name}`}
                src={LINKS.mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* ── FAQ locale (accordéon natif <details>, indexable) ── */}
        <section className="local-seo section-pad city-faq" id="faq">
          <div className="container">
            <p className="section-label">Questions fréquentes</p>
            <h2 className="city-section-title">
              Fast food {city.name} :
              <br />
              vos questions, nos réponses.
            </h2>
            <div className="city-faq-list">
              {city.faq.map((item) => (
                <details className="city-faq-item" key={item.question}>
                  <summary>
                    {item.question}
                    <span className="city-faq-icon" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Maillage : pages villes sœurs + retour accueil (Torcy) ── */}
        <section className="city-others section-pad">
          <div className="container">
            <p className="section-label">Nos snacks alentour</p>
            <h2 className="city-section-title">Fast food autour de Torcy.</h2>
            <div className="cities-grid">
              <article className="cities-card">
                <h3>Fast food Torcy (77200)</h3>
                <p>
                  Notre snack est installé au 57 Rue de Paris, à deux pas de la
                  gare RER A et du centre commercial Bay 2. Burgers maison,
                  sandwichs au four et crêpes, 7 j/7.
                </p>
                <Link href="/" className="cities-card-link" data-cursor-hover>
                  Snack &amp; burger à Torcy <span className="btn-arrow">→</span>
                </Link>
              </article>
              {otherCities.map((c) => (
                <article className="cities-card" key={c.slug}>
                  <h3>
                    Fast food {c.name} ({c.postalCode})
                  </h3>
                  <p>{c.teaser}</p>
                  <Link href={c.path} className="cities-card-link" data-cursor-hover>
                    Snack &amp; burger à {c.name} <span className="btn-arrow">→</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
