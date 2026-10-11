// Liens externes centralisés du restaurant O'Snack Torcy.
// Ces valeurs servent de DÉFAUTS : le dashboard admin (onglet « Liens &
// réseaux ») peut les remplacer à chaud via Firestore (lib/siteSettings.ts).
// Modifier ici pour changer les valeurs par défaut de tout le site.
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
  instagram: 'https://www.instagram.com/osnacktorcy/',
  // Lien de partage Facebook fourni par le restaurant (redirige vers la page).
  facebook: 'https://www.facebook.com/share/1J7AXsE6mP/',
  tiktok: 'https://www.tiktok.com/@osnack.torcy',
  // Twitter / X
  twitter: 'https://x.com/osnacktorcy',
  // ⚠️ À confirmer : compte Snapchat exact. Recherche utilisée en attendant.
  snapchat: 'https://www.snapchat.com/explore/O_Snack_Torcy',
} as const;
