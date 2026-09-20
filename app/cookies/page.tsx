import type { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: "Politique de cookies",
  description:
    "Politique de cookies du site O'Snack Torcy : types de cookies utilisés, finalités, durée de conservation et paramétrage.",
};

export default function CookiesPage() {
  return (
    <LegalLayout>
      <p className="legal-eyebrow">Cookies &amp; traceurs — Mise à jour : août 2026</p>
      <h1>Cookies</h1>

      <p>
        Cette politique vous informe sur l&apos;usage des cookies et traceurs par le site de
        <strong> O&apos;Snack Torcy</strong>, édité par <strong>HBS (EURL)</strong>, et sur la
        manière d&apos;en paramétrer l&apos;utilisation.
      </p>

      <h2>Qu&apos;est-ce qu&apos;un cookie&nbsp;?</h2>
      <p>
        Un cookie est un petit fichier déposé sur votre appareil lors de la visite
        d&apos;un site. Il permet de mémoriser des informations relatives à votre navigation
        (panier, préférences, statistiques de fréquentation) afin d&apos;améliorer votre
        expérience.
      </p>

      <h2>Cookies utilisés</h2>
      <p>Nous distinguons les catégories suivantes&nbsp;:</p>
      <ul>
        <li>
          <strong>Cookies essentiels</strong>&nbsp;: strictement nécessaires au fonctionnement
          du Site (mémorisation du panier, affichage, sécurité). Ils ne nécessitent pas de
          consentement.
        </li>
        <li>
          <strong>Cookies de mesure d&apos;audience</strong>&nbsp;: permettent d&apos;établir
          des statistiques de fréquentation et d&apos;utilisation du Site. Ils nécessitent
          votre consentement.&nbsp;
          <span className="legal-todo">outil d&apos;analyse à compléter (ex. Google Analytics, etc.)</span>
        </li>
        <li>
          <strong>Cookies tiers &amp; réseaux sociaux</strong>&nbsp;: lorsque vous interagissez
          avec des contenus tiers (plateformes de livraison, boutons de partage), ces tiers
          peuvent déposer leurs propres cookies, soumis à leurs propres politiques.
        </li>
      </ul>

      <h2>Durée de conservation</h2>
      <p>
        Les cookies essentiels sont conservés le temps de votre session de navigation. Les
        cookies de mesure d&apos;audience et tiers ont une durée de vie variable, qui ne peut
        excéder 13&nbsp;mois conformément aux recommandations de la CNIL. À l&apos;expiration
        de ce délai, votre consentement devra à nouveau être recueilli.
      </p>

      <h2>Paramétrage &amp; gestion</h2>
      <p>
        Vous pouvez à tout moment exprimer ou retirer votre consentement, ainsi que supprimer
        les cookies déjà déposés, via le module de gestion des cookies lorsqu&apos;il est
        disponible sur le Site, ou directement depuis les paramètres de votre navigateur&nbsp;:
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/fr/kb/cookies-informations-sites-enregistrent" target="_blank" rel="noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer">Apple Safari</a></li>
        <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge" target="_blank" rel="noreferrer">Microsoft Edge</a></li>
      </ul>
      <p>
        Le paramétrage des navigateurs peut varier&nbsp;; nous vous invitons à consulter
        l&apos;aide de votre navigateur ou le site de la{' '}
        <a href="https://www.cnil.fr/fr/cookies-traceurs-que-dit-la-loi" target="_blank" rel="noreferrer">
          CNIL
        </a>{' '}
        pour plus d&apos;informations.
      </p>

      <h2>Pour aller plus loin</h2>
      <p>
        Pour toute question relative au traitement de vos données, consultez notre{' '}
        <a href="/confidentialite">Politique de confidentialité</a> ou contactez-nous à{' '}
        <span className="legal-todo">e-mail à compléter</span>.
      </p>
    </LegalLayout>
  );
}
