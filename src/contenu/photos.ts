// Photos des pages : fichiers dans public/images/ (demo/ : photos Unsplash provisoires, voir CREDITS.md).
// alt : description de la photo pour les lecteurs d'écran.

export type Photo = { url: string; alt: string };

/** Photo de fond de l'accueil (la serre de la maquette). */
export const FOND_ACCUEIL: Photo = { url: '/images/accueil/fond-accueil.jpg', alt: 'Une personne marche dans une serre, entre des rangs de jeunes pousses' };

/** Galerie de la page À propos. */
export const GALERIE_A_PROPOS: Photo[] = [
  { url: '/images/demo/tomates-recolte.jpg', alt: 'Deux mains tiennent un bol de tomates cerises tout juste récoltées' },
  { url: '/images/demo/potager.jpg', alt: 'Un potager en rangs, entre légumes et fleurs' },
  { url: '/images/demo/carottes-fanes.jpg', alt: 'Des mains coupent des carottes avec leurs fanes' },
];

/** Galerie de chaque page d'expérience (clé : le slug de l'expérience, voir experiences.ts). */
export const GALERIES_EXPERIENCES: Record<string, Photo[]> = {
  'atelier-cuisine-anti-gaspi': [
    { url: '/images/demo/herbes-ciselees.jpg', alt: 'Des mains ciselent des herbes sur une planche' },
    { url: '/images/demo/carottes-fanes.jpg', alt: 'Des mains coupent des carottes avec leurs fanes' },
  ],
  'good-tour-marche-producteurs': [
    { url: '/images/demo/marche-radis-carottes.jpg', alt: 'Radis, carottes et salades sur un étal de marché' },
    { url: '/images/demo/panier-legumes-saison.jpg', alt: 'Panier de tomates anciennes, courgettes et haricots' },
  ],
  'immersion-producteur': [
    { url: '/images/demo/tomates-recolte.jpg', alt: 'Deux mains tiennent un bol de tomates cerises tout juste récoltées' },
    { url: '/images/demo/potager.jpg', alt: 'Un potager en rangs, entre légumes et fleurs' },
  ],
};
