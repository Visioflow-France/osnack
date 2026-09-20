// Liens externes centralisés du restaurant O'Snack Torcy.
// Modifier ici pour mettre à jour tous les boutons du site en un seul endroit.
export const LINKS = {
  address: '57 Rue de Paris, 77200 Torcy',
  addressQuery: 'https://maps.google.com/?q=57+Rue+de+Paris+77200+Torcy',
  // Intégration Google Maps sans clé API (paramètre output=embed)
  mapsEmbed:
    'https://maps.google.com/maps?q=57%20Rue%20de%20Paris%2C%2077200%20Torcy&z=15&output=embed',
  phone: '09 88 08 61 25',
  phoneHref: 'tel:0988086125',

  // Plateformes de commande
  uberEats: 'https://www.ubereats.com/fr/store/osnack/Tgqr7T_WAC_F6OqCFnLoQ',
  // ⚠️ À confirmer : page Deliveroo exacte. Recherche utilisée en attendant.
  deliveroo: 'https://deliveroo.fr/fr/search?q=O%27Snack%20Torcy',

  // Réseaux sociaux
  instagram: 'https://www.instagram.com/osnackofficiel/',
  // ⚠️ À confirmer : page Facebook exacte. Recherche utilisée en attendant.
  facebook: 'https://www.facebook.com/search/top?q=O%27Snack%20Torcy',
} as const;
