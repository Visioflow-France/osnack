import type { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de protection des données personnelles (RGPD) du site O'Snack Torcy : données collectées, finalités, droits.",
};

export default function ConfidentialitePage() {
  return (
    <LegalLayout>
      <p className="legal-eyebrow">Protection des données — Mise à jour : août 2026</p>
      <h1>Confidentialité</h1>

      <p>
        La société <strong>HBS (EURL)</strong>, exploitant le restaurant{' '}
        <strong>O&apos;Snack Torcy</strong>, attache une grande importance à la protection
        de la vie privée et au respect du Règlement Général sur la Protection des Données
        (RGPD&nbsp;– Règlement UE 2016/679) et de la loi «&nbsp;Informatique et
        Libertés&nbsp;».
      </p>

      <h2>Responsable du traitement</h2>
      <p>Le responsable du traitement des données est&nbsp;:</p>
      <dl className="legal-dl">
        <dt>Entité</dt>
        <dd>HBS — EURL (O&apos;Snack Torcy)</dd>
        <dt>Adresse</dt>
        <dd>57 rue de Paris, 77200 Torcy, France</dd>
        <dt>Contact</dt>
        <dd>
          <span className="legal-todo">e-mail DPO/contact à compléter</span>
        </dd>
      </dl>

      <h2>Données collectées</h2>
      <p>Nous sommes susceptibles de collecter les catégories de données suivantes&nbsp;:</p>
      <ul>
        <li>
          <strong>Données de commande</strong>&nbsp;: nom, prénom, numéro de téléphone,
          adresse e-mail, adresse de livraison éventuelle, détail et montant des commandes.
        </li>
        <li>
          <strong>Données de navigation</strong>&nbsp;: adresse IP, type et version de
          navigateur, pages consultées, date et heure de visite (via cookies et journaux
          techniques).
        </li>
        <li>
          <strong>Messages &amp; avis</strong>&nbsp;: contenu des messages que vous nous
          adressez (contact, avis clients).
        </li>
      </ul>

      <h2>Finalités &amp; base légale</h2>
      <ul>
        <li>
          Gestion et exécution des commandes (paiement, préparation, retrait, livraison)&nbsp;—
          base&nbsp;: exécution du contrat.
        </li>
        <li>
          Réponse à vos demandes (contact, réclamations)&nbsp;— base&nbsp;: exécution de
          mesures précontractuelles ou contractuelles / intérêt légitime.
        </li>
        <li>
          Respect des obligations légales (facturation, comptabilité)&nbsp;— base&nbsp;:
          obligation légale.
        </li>
        <li>
          Mesure d&apos;audience et amélioration du Site&nbsp;— base&nbsp;: votre consentement
          (cookies) et/ou notre intérêt légitime.
        </li>
      </ul>

      <h2>Destinataires des données</h2>
      <p>
        Vos données sont destinées à HBS et, le cas échéant, à ses prestataires techniques
        agissant pour son compte&nbsp;: hébergeur du Site, prestataire de paiement, et
        plateformes de livraison partenaires pour les commandes passées via celles-ci. Ces
        acteurs n&apos;accèdent aux données que dans la mesure strictement nécessaire à la
        prestation et dans le respect de la législation applicable.
      </p>
      <p>
        Vos données ne font l&apos;objet d&apos;aucune vente ni d&apos;aucune cession à des
        fins commerciales à des tiers.
      </p>

      <h2>Transferts hors de l&apos;Union européenne</h2>
      <p>
        Certaines données peuvent être traitées par notre hébergeur (Vercel Inc.) situé aux
        États-Unis. De tels transferts encadrent la protection de vos données au moyen de
        garanties appropriées (clauses contractuelles types) et dans le respect du RGPD.
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Les données sont conservées pour la durée strictement nécessaire aux finalités
        décrites&nbsp;: données de commande et justifications comptables conservées selon les
        obligations légales en vigueur&nbsp;; données de navigation limitées à la durée
        nécessaire à la mesure d&apos;audience. Au-delà, elles sont supprimées ou anonymisées.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
        d&apos;effacement, d&apos;opposition, de limitation du traitement et de portabilité de
        vos données. Vous pouvez les exercer à tout moment en nous contactant à&nbsp;:
        <span className="legal-todo">e-mail à compléter</span>.
      </p>
      <p>
        Vous pouvez également introduire une réclamation auprès de l&apos;autorité de contrôle
        compétente, la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noreferrer">cnil.fr</a>).
      </p>

      <h2>Cookies</h2>
      <p>
        L&apos;utilisation des cookies et traceurs est décrite dans notre{' '}
        <a href="/cookies">Politique de cookies</a>.
      </p>

      <h2>Sécurité</h2>
      <p>
        HBS met en œuvre des mesures techniques et organisationnelles raisonnables afin de
        protéger vos données contre la perte, l&apos;accès non autorisé ou la divulgation.
      </p>
    </LegalLayout>
  );
}
