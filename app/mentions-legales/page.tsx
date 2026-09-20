import type { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site O'Snack Torcy : éditeur (HBS EURL), directeur de la publication, hébergeur et propriété intellectuelle.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalLayout>
      <p className="legal-eyebrow">Informations légales — Mise à jour : août 2026</p>
      <h1>Mentions légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        Le présent site internet (ci-après le «&nbsp;Site&nbsp;»), présentant
        l&apos;activité du restaurant <strong>O&apos;Snack Torcy</strong>, est édité par&nbsp;:
      </p>
      <dl className="legal-dl">
        <dt>Dénomination</dt>
        <dd>HBS — EURL</dd>
        <dt>Forme juridique</dt>
        <dd>Entreprise unipersonnelle à responsabilité limitée (EURL)</dd>
        <dt>Siège social</dt>
        <dd>57 rue de Paris, 77200 Torcy, France</dd>
        <dt>Capital social</dt>
        <dd>1 000,00&nbsp;€</dd>
        <dt>SIREN</dt>
        <dd>843&nbsp;426&nbsp;040</dd>
        <dt>SIRET (siège)</dt>
        <dd>843&nbsp;426&nbsp;040&nbsp;00013</dd>
        <dt>N° de TVA intracommunautaire</dt>
        <dd>FR&nbsp;55&nbsp;843&nbsp;426&nbsp;040</dd>
        <dt>Immatriculation</dt>
        <dd>843&nbsp;426&nbsp;040 R.C.S. Meaux — inscrite le 19/11/2018</dd>
        <dt>Contact</dt>
        <dd>
          <span className="legal-todo">e-mail à compléter</span>
          <br />
          <span className="legal-todo">téléphone à compléter</span>
        </dd>
      </dl>

      <h2>Directeur de la publication</h2>
      <p>
        Le directeur de la publication est <strong>M.&nbsp;Samba Doucoure</strong>, en sa
        qualité de gérant de l&apos;EURL HBS.
      </p>

      <h2>Hébergement</h2>
      <p>Le Site est hébergé par&nbsp;:</p>
      <dl className="legal-dl">
        <dt>Hébergeur</dt>
        <dd>Vercel Inc.</dd>
        <dt>Adresse</dt>
        <dd>340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</dd>
        <dt>Site web</dt>
        <dd>
          <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a>
        </dd>
      </dl>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments du Site (textes, visuels, photographies, logo,
        dénominations, marques, mise en page, structure et code source) est la propriété
        exclusive de HBS, sauf mention contraire, et est protégé par les dispositions du
        Code de la propriété intellectuelle.
      </p>
      <p>
        Toute reproduction, représentation, diffusion, extraction ou réutilisation, totale
        ou partielle, des contenus du Site, par quelque procédé que ce soit, sans
        autorisation écrite préalable de HBS, est interdite et constitue une contrefaçon
        sanctionnée par la loi.
      </p>

      <h2>Responsabilité</h2>
      <p>
        HBS s&apos;efforce de diffuser sur le Site des informations exactes et tenues à
        jour, mais ne saurait garantir l&apos;exhaustivité ni l&apos;absence d&apos;erreur.
        Les informations relatives aux produits, aux prix, aux allergènes et aux valeurs
        nutritionnelles sont susceptibles d&apos;évoluer et sont disponibles sur demande en
        restaurant.
      </p>
      <p>
        HBS ne pourra être tenue responsable des dommages directs ou indirects résultant de
        l&apos;accès au Site, de son utilisation ou de l&apos;impossibilité d&apos;y accéder,
        notamment en cas d&apos;interruption pour maintenance ou dépannage.
      </p>

      <h2>Liens hypertextes</h2>
      <p>
        Le Site peut contenir des liens vers des sites tiers (notamment des plateformes de
        livraison). HBS n&apos;exerce aucun contrôle sur ces sites et décline toute
        responsabilité quant à leur contenu, leurs pratiques ou leurs propres conditions
        générales.
      </p>

      <h2>Données personnelles &amp; cookies</h2>
      <p>
        Le traitement de vos données personnelles est détaillé dans notre{' '}
        <a href="/confidentialite">Politique de confidentialité</a>. L&apos;utilisation des
        cookies et traceurs est décrite dans notre <a href="/cookies">Politique de cookies</a>.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Le Site et les présentes mentions légales sont soumis au droit français. Tout
        litige relève de la compétence des juridictions françaises.
      </p>
    </LegalLayout>
  );
}
