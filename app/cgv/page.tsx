import type { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';
import { LINKS } from '@/lib/links';

export const metadata: Metadata = {
  title: "CGV — Commande en ligne",
  description:
    "Conditions générales de vente (CGV) du restaurant O'Snack Torcy : commandes, prix, paiement, retrait, réclamations.",
};

export default function CGVPage() {
  return (
    <LegalLayout>
      <p className="legal-eyebrow">Conditions générales de vente — Mise à jour : août 2026</p>
      <h1>CGV</h1>

      <p className="legal-callout">
        Les présentes Conditions Générales de Vente (CGV) régissent les ventes de produits
        réalisées par <strong>HBS (EURL)</strong>, exploitant le restaurant{' '}
        <strong>O&apos;Snack Torcy</strong>, 57 rue de Paris, 77200 Torcy, que ce soit sur
        place, à emporter (click &amp; collect) ou via le présent Site.
      </p>

      <h2>Article 1 — Objet</h2>
      <p>
        Les présentes CGV ont pour objet de définir les droits et obligations des parties
        dans le cadre de la vente et de la fourniture de produits de restauration (sandwichs,
        burgers, accompagnements, boissons et menus) proposés par O&apos;Snack Torcy à ses
        clients (les «&nbsp;Clients&nbsp;»).
      </p>
      <p>
        Elles s&apos;appliquent à toutes les ventes effectuées, à l&apos;exclusion de toutes
        autres conditions. Le fait de passer commande implique l&apos;acceptation pleine et
        entière des présentes CGV.
      </p>

      <h2>Article 2 — Produits &amp; prix</h2>
      <p>
        Les produits proposés sont destinés à une consommation immédiate. Les prix sont
        indiqués en euros, toutes taxes comprises (TTC). Ils tiennent compte de la TVA
        applicable au jour de la commande&nbsp;; toute modification du taux de TVA sera
        répercutée sur les prix.
      </p>
      <p>
        Les photographies et illustrations n&apos;ont qu&apos;une valeur indicative et
        n&apos;engagent pas O&apos;Snack Torcy. La disponibilité des produits peut varier
        selon l&apos;arrivage et la saison.
      </p>
      <p>
        Les allergènes présents dans les produits sont signalés sur demande en restaurant.
        En cas d&apos;allergie grave, il appartient au Client de se renseigner avant toute
        commande.
      </p>

      <h2>Article 3 — Commandes</h2>
      <p>La commande peut être passée&nbsp;:</p>
      <ul>
        <li>directement en caisse, sur place&nbsp;;</li>
        <li>par téléphone au {LINKS.phone}&nbsp;;</li>
        <li>
          sur le Site (commande en ligne), avec règlement au moment du retrait au
          restaurant, en espèces ou par carte bancaire&nbsp;;
        </li>
        <li>par le biais d&apos;une plateforme de livraison partenaire.</li>
      </ul>
      <p>
        Toute commande vaut acceptation des prix et descriptions des produits tels
        qu&apos;affichés au moment de la commande. O&apos;Snack Torcy se réserve le droit de
        refuser ou d&apos;annuler toute commande pour motif légitime (erreur de prix, rupture
        de stock, caractère anormal de la commande).
      </p>

      <h2>Article 4 — Paiement</h2>
      <p>
        Pour les commandes passées sur le Site, le paiement s&apos;effectue au moment du
        retrait, en espèces ou par carte bancaire. Pour les commandes passées en caisse ou
        par téléphone, le paiement est exigible à la commande, en espèces, par carte
        bancaire ou par tout autre moyen accepté par le restaurant. Les sommes encaissées ne
        pourront être considérées comme des arrhes sauf accord contraire exprès.
      </p>

      <h2>Article 5 — Retrait sur place &amp; livraison</h2>
      <p>
        Pour les commandes à emporter, le Client s&apos;engage à retirer sa commande à
        l&apos;horaire convenu. Les produits doivent être consommés dans un délai raisonnable
        afin d&apos;en garantir la qualité et la sécurité sanitaire.
      </p>
      <p>
        Les commandes livrées par l&apos;intermédiaire d&apos;une plateforme tierce restent
        soumises aux conditions générales d&apos;utilisation de ladite plateforme pour tout ce
        qui concerne la livraison et le paiement en ligne.
      </p>

      <h2>Article 6 — Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L.&nbsp;221-28 du Code de la consommation, le droit de
        rétractation <strong>ne s&apos;applique pas</strong> aux fournitures de denrées
        alimentaires et de boissons destinées à la consommation courante. Les produits
        alimentaires étant périssables et préparés à la demande, aucune rétractation ni
        aucun retour ne peuvent être acceptés après exécution de la commande, sauf produit
        non conforme.
      </p>

      <h2>Article 7 — Réclamations &amp; garanties</h2>
      <p>
        En cas de produit non conforme ou de litige, le Client peut formuler une réclamation
        en restaurant ou par e-mail à <span className="legal-todo">e-mail à compléter</span>,
        dans les meilleurs délais et en justifiant de sa commande.
      </p>
      <p>
        À défaut de résolution amiable, le Client peut recourir gratuitement à un médiateur de
        la consommation en vue de la résolution du litige, ou saisir la plateforme européenne
        de règlement en ligne des litiges (ODR)&nbsp;:{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
          ec.europa.eu/consumers/odr
        </a>
        .
      </p>

      <h2>Article 8 — Données personnelles</h2>
      <p>
        Les données collectées dans le cadre des commandes font l&apos;objet d&apos;un
        traitement décrit dans notre <a href="/confidentialite">Politique de
        confidentialité</a>.
      </p>

      <h2>Article 9 — Modification des CGV</h2>
      <p>
        HBS se réserve le droit de modifier les présentes CGV à tout moment. Les CGV
        applicables sont celles en vigueur au jour de la commande.
      </p>

      <h2>Article 10 — Droit applicable &amp; litiges</h2>
      <p>
        Les présentes CGV sont soumises au droit français. En cas de litige, une solution
        amiable sera recherchée en priorité&nbsp;; à défaut, les tribunaux français seront
        seuls compétents.
      </p>
    </LegalLayout>
  );
}
