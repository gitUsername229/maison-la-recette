// Les expériences présentées sur le site (une page chacune : /experiences/<slug>). Les dates, prix et places ne sont
// pas ici : ils viennent des événements du calendrier Luma de la cliente.
// - reservation « luma » : la page liste les prochains événements Luma qui portent l'étiquette (tag) etiquetteLuma,
//   chacun avec son bouton « Réserver sur Luma » ; « devis » : sur devis uniquement (immersions, entreprises).
// - image : photo de couverture (public/images/…) ; galerie de la page : src/contenu/photos.ts.

export type TypeExperience = 'atelier' | 'good_tour' | 'immersion';

export type Experience = {
  slug: string;                     // adresse de la page, minuscules et tirets (« entreprises » est réservé)
  type: TypeExperience;             // libellé affiché : Atelier, Food tour, Immersion
  titre: string;
  accroche: string;
  description: string;
  dureeMin: number;
  lieu: string | null;
  image: string;
  imageAlt: string;
  reservation: 'luma' | 'devis';
  etiquetteLuma?: string;           // tag des événements Luma de cette expérience (reservation « luma »)
};

export const EXPERIENCES: Experience[] = [
  {
    slug: 'atelier-cuisine-anti-gaspi',
    type: 'atelier',
    titre: 'Atelier cuisine anti-gaspi',
    accroche: 'Cuisiner avec ce qu’on jette d’habitude',
    description: 'Cuisiner avec ce qu’on jette d’habitude. Contenu de démonstration à remplacer.',
    dureeMin: 150,
    lieu: 'La Rochelle',
    image: '/images/demo/planche-tomates.jpg',
    imageAlt: 'Légumes coupés sur une planche, tomates et oignons nouveaux autour',
    reservation: 'luma',
    etiquetteLuma: 'Atelier',
  },
  {
    slug: 'good-tour-marche-producteurs',
    type: 'good_tour',
    titre: 'Food tour : marché et producteurs',
    accroche: 'À la rencontre de celles et ceux qui nous nourrissent',
    description: 'À la rencontre de celles et ceux qui nous nourrissent. Contenu de démonstration à remplacer.',
    dureeMin: 180,
    lieu: 'La Rochelle',
    image: '/images/demo/marche-etal-legumes.jpg',
    imageAlt: 'Étal de marché : chou-fleur, brocolis, radis et oignons nouveaux',
    reservation: 'luma',
    etiquetteLuma: 'Food tour',
  },
  {
    slug: 'immersion-producteur',
    type: 'immersion',
    titre: 'Immersion chez un producteur',
    accroche: 'Découvrir un métier au fil d’une journée',
    description: 'Découvrir un métier au fil d’une journée. Contenu de démonstration à remplacer.',
    dureeMin: 240,
    lieu: 'La Rochelle',
    image: '/images/demo/producteur-betteraves.jpg',
    imageAlt: 'Un maraîcher tient une botte de betteraves dans son champ',
    reservation: 'devis',
  },
];
