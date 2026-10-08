// Producteurs et artisans partenaires (page À propos), affichés seulement après leur accord.
// Exemple : { nom: 'Ferme des Trois Chênes', metier: 'Maraîchère', photo: '/images/partenaires/ferme.jpg',
//             photoAlt: 'La maraîchère dans ses serres', description: 'Légumes de saison en agriculture biologique.' }
// Photo : déposer le fichier dans public/images/partenaires/.

export type Partenaire = { nom: string; metier: string; photo: string; photoAlt: string; description: string };

export const PARTENAIRES: Partenaire[] = [];
