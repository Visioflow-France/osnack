import { LINKS } from './links';
import { BUSINESS } from './site';

/**
 * ── Pages d'atterrissage locales (SEO multi-villes) ──────────────────────────
 *
 * Une page par ville autour de Torcy (Noisiel, Lognes, Collégien) pour capter
 * les requêtes « fast food / snack / burger + ville ». Chaque ville possède un
 * contenu 100 % unique (intro, blocs, FAQ) : ce sont de vraies pages locales
 * (distances, RER, itinéraires, repères de la commune), pas des pages dupliquées.
 *
 * URLs : /fast-food-noisiel, /fast-food-lognes, /fast-food-collegien
 * (route dynamique app/fast-food-[ville]/page.tsx, pré-rendue statiquement).
 *
 * Le texte peut contenir du gras via la syntaxe **mot** (rendu par le
 * composant RichText — sources internes uniquement, aucune saisie utilisateur).
 */

export interface CityFaq {
  question: string;
  answer: string;
}

export interface CityBlockAction {
  label: string;
  href: string;
  external?: boolean;
}

export interface CityBlock {
  title: string;
  body: string;
  action: CityBlockAction;
}

export interface CityLanding {
  /** Segment URL (« noisiel » → /fast-food-noisiel). */
  slug: string;
  /** Nom de la commune, accentué (« Noisiel », « Collégien »). */
  name: string;
  postalCode: string;
  /** Chemin canonique complet (« /fast-food-noisiel »). */
  path: string;
  /** Balise <title> (~60 caractères max, mots-clés en tête). */
  metaTitle: string;
  /** Meta description (~155 caractères, mots-clés + incitation). */
  metaDescription: string;
  /** Label au-dessus du H1. */
  label: string;
  /** H1 unique de la page. */
  h1: string;
  /** Paragraphe d'introduction unique (gras via **…**). */
  intro: string;
  /** Phrase courte pour les cartes de l'accueil et du footer. */
  teaser: string;
  blocks: CityBlock[];
  faq: CityFaq[];
}

/** Pages villes autour de Torcy (la page Torcy = l'accueil du site). */
export const CITY_LANDINGS: CityLanding[] = [
  {
    slug: 'noisiel',
    name: 'Noisiel',
    postalCode: '77186',
    path: '/fast-food-noisiel',
    metaTitle: 'Fast Food Noisiel — Snack & Burger 77186 | O’Snack Torcy',
    metaDescription:
      'Fast food près de Noisiel (77186) : O’Snack, snack à Torcy à 8 min en voiture ou 2 stations de RER A. Burgers, sandwichs au four, crêpes — 7j/7, à emporter ou en livraison.',
    label: 'Fast Food · Snack · Noisiel (77186)',
    h1: 'Fast food à Noisiel : O’Snack, votre snack & burger à 8 minutes',
    intro:
      'Vous cherchez un **fast food près de Noisiel** (77186) ? Direction **O’Snack**, le snack de Torcy tout proche : **environ 3 km**, soit **8 minutes en voiture** par la D344, ou **2 stations de RER A** (Noisiel → Torcy). Burgers préparés à la commande, sandwichs grillés au four, crêpes maison et milkshakes : le meilleur du **fast food** du Val Maubuée se déguste **à emporter, sur place ou en livraison**, midi et soir, **7 jours sur 7**. L’adresse idéale après une balade au **parc de Noisiel** ou une journée du côté de l’**usine Menier**.',
    teaser:
      'À 8 minutes en voiture ou 2 stations de RER A : le snack O’Snack régale Noisiel 7j/7, midi et soir.',
    blocks: [
      {
        title: 'Venir de Noisiel à O’Snack',
        body:
          '**En voiture** : environ 3 km par la D344 direction Torcy, 8 minutes depuis le centre de Noisiel. **En RER A** : direction Marne-la-Vallée – Chessy, descendez à **Torcy, 2 stations** (environ 5 minutes de trajet) puis rejoignez le 57 Rue de Paris. **À vélo** : une dizaine de minutes tranquilles.',
        action: {
          label: 'Itinéraire Google Maps',
          href: LINKS.addressQuery,
          external: true,
        },
      },
      {
        title: 'Burgers, sandwichs & crêpes',
        body:
          'Le **fast food d’à côté**, sans compromis : burgers du **Cheese** au **Double Original** en passant par les généreux **Le 180, Le 360 et Le 540**, sandwichs grecs et escalopes **grillés au four**, menus complets, **crêpes** salées et sucrées, nuggets, tenders et **milkshakes** Oreo, Snickers ou Kinder Bueno. Un vrai snack maison à deux pas de Noisiel, **à prix doux** — avec son **Menu Étudiant** pensé pour le secteur.',
        action: { label: 'Voir la carte du snack', href: '/carte' },
      },
      {
        title: 'Livraison à Noisiel & retrait express',
        body:
          'Soirée burger à Noisiel sans bouger de chez vous ? **Uber Eats** et **Deliveroo** livrent Noisiel et les communes voisines depuis O’Snack. Encore plus rapide : **commandez en ligne** sur notre site (paiement au retrait, espèces ou carte) et récupérez votre commande **dès 20 minutes** au 57 Rue de Paris à Torcy.',
        action: { label: 'Commander en ligne', href: '/commander' },
      },
      {
        title: 'Horaires du snack près de Noisiel',
        body:
          'O’Snack vous accueille **7 j/7**, midi et soir : **11h30 – 14h30** et **18h00 – 01h00**, week-ends compris. Petite faim tardive après le RER ou le travail ? On est là. Appelez-nous au ' +
          BUSINESS.phone +
          ' ou commandez en ligne en 2 minutes.',
        action: { label: 'Appeler le snack', href: LINKS.phoneHref },
      },
    ],
    faq: [
      {
        question: 'Où trouver un bon fast food près de Noisiel ?',
        answer:
          "O'Snack, snack fast food installé au 57 Rue de Paris à Torcy (77200), se trouve à environ 3 km du centre de Noisiel — soit 8 minutes en voiture par la D344, ou 2 stations de RER A (Noisiel → Torcy). Burgers maison, sandwichs au four, crêpes et tex-mex y sont servis 7 jours sur 7, midi et soir.",
      },
      {
        question: 'Comment venir de Noisiel en transports en commun ?',
        answer:
          "Prenez le RER A à la gare de Noisiel, direction Marne-la-Vallée – Chessy, et descendez à Torcy, 2 stations plus loin (environ 5 minutes de trajet — les trains passent environ toutes les 10 minutes en journée). Le restaurant se situe ensuite à quelques minutes à pied de la gare, au 57 Rue de Paris.",
      },
      {
        question: 'Livrez-vous à Noisiel ?',
        answer:
          "Oui : O'Snack est disponible sur Uber Eats et Deliveroo, qui livrent Noisiel et les communes voisines selon les créneaux d'ouverture. Vous pouvez aussi commander directement sur notre site — paiement au retrait, en espèces ou par carte — et retirer votre commande dès 20 minutes en boutique à Torcy.",
      },
      {
        question: 'Quels burgers propose le snack près de Noisiel ?',
        answer:
          "La carte des burgers va du Cheese au Double Original, avec les très généreux Le 180, Le 360 et Le 540, le Burger Raclette, le Chicken Burger ou encore le Végétarien. Chaque burger est préparé à la commande, avec frites et sauces. Sandwichs au four, crêpes maison, tex-mex et milkshakes complètent la carte.",
      },
      {
        question: 'Le fast food O’Snack est-il ouvert tard le soir ?',
        answer:
          "Oui : O'Snack est ouvert 7 jours sur 7, de 11h30 à 14h30 et de 18h00 à 01h00 — pratique pour dîner tard après le travail, une sortie à Noisiel ou un match du soir. La commande en ligne permet de programmer son retrait jusqu'à la fermeture.",
      },
    ],
  },
  {
    slug: 'lognes',
    name: 'Lognes',
    postalCode: '77185',
    path: '/fast-food-lognes',
    metaTitle: 'Fast Food Lognes — Snack & Burger 77185 | O’Snack Torcy',
    metaDescription:
      'Fast food près de Lognes (77185) : O’Snack à 1 station de RER A ou 5 min en voiture de Torcy. Burgers, sandwichs au four, crêpes — ouvert 7j/7, à emporter ou en livraison.',
    label: 'Fast Food · Snack · Lognes (77185)',
    h1: 'Fast food à Lognes : O’Snack, snack & burgers à 1 station de RER',
    intro:
      'Vous cherchez un **snack près de Lognes** (77185) qui cuisine vraiment ? **O’Snack** vous attend à **1 station de RER A** (Lognes → Torcy) ou **5 minutes en voiture** du centre. Nos **burgers** sont montés à la commande, nos sandwichs grillés **au four**, nos **crêpes** préparées maison — de **11h30 à 14h30** et de **18h00 à 01h00**, **7 jours sur 7**. À emporter, sur place ou **livré chez vous** : le fast food du Val Maubuée qui régale les Lognots.',
    teaser:
      'À 1 station de RER A ou 5 min de voiture : burgers, sandwichs au four et crêpes maison, 7j/7.',
    blocks: [
      {
        title: 'Venir de Lognes à O’Snack',
        body:
          '**En RER A** : une seule station, **Lognes → Torcy** (environ 3 minutes de trajet), puis quelques minutes à pied jusqu’au 57 Rue de Paris. **En voiture** : moins de 3 km par la D344, 5 à 6 minutes depuis le centre de Lognes ou le **lac de Lognes**. **À vélo** : une dizaine de minutes depuis le quartier de la gare.',
        action: {
          label: 'Itinéraire Google Maps',
          href: LINKS.addressQuery,
          external: true,
        },
      },
      {
        title: 'Le burger qui réveille Lognes',
        body:
          'Envie d’un **burger près de Lognes** sans rouler jusqu’à Chessy ? Du **Cheese** au **Double Original** en passant par **Le 540** pour les grosses faims, chaque burger est **préparé à la commande**. Autour : sandwichs grecs et escalopes **au four**, **Menu Étudiant** et Menu Enfant, **crêpes** salées et sucrées, nuggets, tenders et **milkshakes** onctueux — le tout à prix snack.',
        action: { label: 'Découvrir la carte', href: '/carte' },
      },
      {
        title: 'Livraison à Lognes & retrait',
        body:
          '**Uber Eats** et **Deliveroo** livrent Lognes depuis O’Snack : burgers chauds, menus complets et crêpes livrés à domicile, midi et soir. Pour aller encore plus vite, **commandez en ligne** sur notre site et retirez votre commande **dès 20 minutes** au 57 Rue de Paris à Torcy — paiement en espèces ou par carte, au retrait.',
        action: { label: 'Commander en ligne', href: '/commander' },
      },
      {
        title: 'Un snack ouvert tard près de Lognes',
        body:
          'Sortie tardive au **lac de Lognes**, fin de journée à l’**aérodrome de Lognes-Émerainville** ou petite faim de minuit ? O’Snack sert **jusqu’à 01h00, tous les jours**, avec le service du midi de **11h30 à 14h30**. Appelez le ' +
          BUSINESS.phone +
          ' ou commandez en ligne.',
        action: { label: 'Appeler le snack', href: LINKS.phoneHref },
      },
    ],
    faq: [
      {
        question: 'Quel fast food est le plus proche de Lognes ?',
        answer:
          "O'Snack, au 57 Rue de Paris à Torcy (77200), est l'un des snacks les plus proches de Lognes : environ 2,5 km, soit 5 à 6 minutes en voiture, ou une seule station de RER A entre les gares de Lognes et de Torcy.",
      },
      {
        question: 'Comment rejoindre O’Snack depuis la gare de Lognes ?',
        answer:
          "Prenez le RER A direction Marne-la-Vallée – Chessy et descendez à Torcy, une seule station (environ 3 minutes — les trains passent environ toutes les 10 minutes en journée). Le restaurant se trouve ensuite à quelques minutes à pied de la gare, au 57 Rue de Paris.",
      },
      {
        question: 'Peut-on se faire livrer un burger à Lognes ?',
        answer:
          "Oui : O'Snack est référencé sur Uber Eats et Deliveroo, qui livrent Lognes et les communes voisines. Vous pouvez également commander sur notre site et choisir le retrait en boutique dès 20 minutes, avec paiement en espèces ou par carte au moment du retrait.",
      },
      {
        question: 'Quels sont les horaires du snack près de Lognes ?',
        answer:
          "O'Snack est ouvert 7 jours sur 7, de 11h30 à 14h30 et de 18h00 à 01h00 — y compris le week-end. Idéal pour la pause déjeuner, le dîner ou une faim tardive à Lognes.",
      },
      {
        question: 'Y a-t-il un snack ouvert tard à côté de Lognes ?',
        answer:
          "Oui : O'Snack à Torcy sert tous les jours jusqu'à 01h00 du matin. À une station de RER A ou 5 minutes en voiture de Lognes, c'est le plan burger du soir — sur place, à emporter ou en livraison.",
      },
    ],
  },
  {
    slug: 'collegien',
    name: 'Collégien',
    postalCode: '77090',
    path: '/fast-food-collegien',
    metaTitle: 'Fast Food Collégien — Snack & Burger 77090 | O’Snack Torcy',
    metaDescription:
      'Fast food près de Collégien (77090) : O’Snack, snack à 8 min en voiture de Torcy. Burgers, sandwichs au four, crêpes — ouvert 7j/7, à emporter ou en livraison.',
    label: 'Fast Food · Snack · Collégien (77090)',
    h1: 'Fast food à Collégien : O’Snack, votre snack & burger à 8 minutes',
    intro:
      'Vous cherchez un **fast food près de Collégien** (77090) ? **O’Snack** vous attend à **8 minutes en voiture**, au 57 Rue de Paris à Torcy. Burgers **préparés à la commande**, sandwichs grillés **au four**, **crêpes** maison et milkshakes généreux : le **snack** préféré du Val Maubuée se déguste **à emporter, sur place ou en livraison**, **7 jours sur 7** — midi et soir, jusqu’à 01h00. Le plan burger des Collégeois, à deux pas du **centre commercial Bay 2**.',
    teaser:
      'À 8 minutes de voiture du village : burgers maison, sandwichs au four et crêpes, 7j/7.',
    blocks: [
      {
        title: 'Venir de Collégien à O’Snack',
        body:
          '**En voiture** : environ 4 km depuis le village de Collégien, 8 minutes en direction de Torcy — le restaurant est à deux pas du **centre commercial Bay 2**. **En transports** : la gare RER A de **Lognes** (1 station de Torcy) est à quelques minutes en voiture du village. **À vélo** : environ un quart d’heure.',
        action: {
          label: 'Itinéraire Google Maps',
          href: LINKS.addressQuery,
          external: true,
        },
      },
      {
        title: 'Burgers & snacks près de Collégien',
        body:
          'Chez O’Snack, tout est **préparé à la commande** : burgers du **Cheese** au **Double Original**, les très copieux **Le 180, Le 360 et Le 540**, le **Burger Raclette**, sandwichs grecs et escalopes **au four**, menus complets, **crêpes** maison, nuggets, tenders, **bouchées Camembert** et milkshakes. Le **fast food généreux** que méritent les Collégeois.',
        action: { label: 'Voir toute la carte', href: '/carte' },
      },
      {
        title: 'Livraison à Collégien & retrait',
        body:
          'Les soirées burger à Collégien, c’est **Uber Eats** et **Deliveroo** qui les livrent — ou votre voiture pour un **retrait dès 20 minutes** après commande en ligne sur notre site. Paiement **espèces ou carte**, au retrait comme en livraison.',
        action: { label: 'Commander en ligne', href: '/commander' },
      },
      {
        title: 'Horaires & adresse du snack',
        body:
          '**57 Rue de Paris, 77200 Torcy** — ouvert **7 j/7** de **11h30 à 14h30** et de **18h00 à 01h00**. À 8 minutes de Collégien, c’est l’adresse de la pause déjeuner comme du dîner tardif. Appelez le ' +
          BUSINESS.phone +
          ' ou commandez en ligne.',
        action: { label: 'Appeler le snack', href: LINKS.phoneHref },
      },
    ],
    faq: [
      {
        question: 'Où manger un burger près de Collégien ?',
        answer:
          "O'Snack, snack fast food au 57 Rue de Paris à Torcy, se trouve à environ 4 km de Collégien, soit 8 minutes en voiture. Burgers préparés à la commande (du Cheese au Le 540), sandwichs au four, crêpes maison, tex-mex et milkshakes — sur place, à emporter ou en livraison.",
      },
      {
        question: 'Comment venir à O’Snack depuis Collégien ?',
        answer:
          "En voiture, comptez environ 8 minutes depuis le village en direction de Torcy (le restaurant est proche du centre commercial Bay 2). En transports, la gare RER A de Lognes — à quelques minutes en voiture de Collégien — vous dépose à Torcy en 1 station. À vélo, environ 15 minutes.",
      },
      {
        question: 'Livrez-vous à Collégien ?',
        answer:
          "Oui : O'Snack est disponible sur Uber Eats et Deliveroo, qui livrent Collégien et les communes voisines selon les créneaux. Autre option : la commande en ligne sur notre site, avec retrait dès 20 minutes en boutique à Torcy (paiement espèces ou carte au retrait).",
      },
      {
        question: 'Le snack O’Snack est-il ouvert le dimanche ?',
        answer:
          "Oui, O'Snack est ouvert 7 jours sur 7, week-ends et jours fériés compris : de 11h30 à 14h30 et de 18h00 à 01h00. Le dimanche soir, c'est aussi burger à volonté… ou presque.",
      },
      {
        question: 'Peut-on commander à emporter depuis Collégien ?',
        answer:
          "Bien sûr : commandez en ligne sur notre site (paiement au retrait, en espèces ou par carte) et votre commande est prête dès 20 minutes. Le retrait est possible à chaque service, midi et soir, 7 jours sur 7.",
      },
    ],
  },
];

/** Retrouve une page ville par son slug URL (null si inconnu). */
export function cityBySlug(slug: string): CityLanding | undefined {
  return CITY_LANDINGS.find((c) => c.slug === slug);
}
