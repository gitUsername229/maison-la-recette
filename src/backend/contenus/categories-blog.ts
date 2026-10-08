import 'server-only';

// Catégories du blog : seul fichier où elles sont nommées. La clé apparaît dans l'adresse
// (/blog/categorie/<clé>) et en base (Article.categorie) ; la description sert aux moteurs de recherche
// et à l'en-tête de la page de la catégorie ; `appelDevis` ajoute sous l'article l'encadré « Demander un devis ».

export const CATEGORIES_BLOG = {
  'retours-experience': {
    libelle: 'Retours d’expérience',
    description: 'Récits de nos ateliers, food tours et immersions autour de l’alimentation.',
    appelDevis: false,
  },
  'coulisses-podcast': {
    libelle: 'Coulisses du podcast',
    description: 'Les coulisses du podcast « la recette » : la préparation des épisodes et ce qui les prolonge.',
    appelDevis: false,
  },
  guides: {
    libelle: 'Guides pratiques',
    description: 'Conseils et astuces pour cuisiner durable et limiter le gaspillage au quotidien.',
    appelDevis: false,
  },
  entreprises: {
    libelle: 'Pour les entreprises',
    description: 'Ateliers, food tours et immersions pour vos équipes : des repères pour organiser une expérience culinaire en entreprise.',
    appelDevis: true,
  },
} as const satisfies Record<string, { libelle: string; description: string; appelDevis: boolean }>;

export type CategorieBlog = keyof typeof CATEGORIES_BLOG;

export const CLES_CATEGORIES = Object.keys(CATEGORIES_BLOG) as [CategorieBlog, ...CategorieBlog[]];

/** Catégorie des articles qui n'en ont pas choisi (valeur par défaut en base, voir prisma/schema.prisma). */
export const CATEGORIE_PAR_DEFAUT: CategorieBlog = 'guides';

export const estCategorie = (cle: string): cle is CategorieBlog => Object.hasOwn(CATEGORIES_BLOG, cle);

export const libelleCategorie = (cle: string) => (estCategorie(cle) ? CATEGORIES_BLOG[cle].libelle : cle);

/** Les articles de cette catégorie invitent à demander un devis (entreprises). */
export const appelDevis = (cle: string) => estCategorie(cle) && CATEGORIES_BLOG[cle].appelDevis;

/** Les catégories dans l'ordre, pour les onglets du blog. */
export const listeCategories = () => CLES_CATEGORIES.map(valeur => ({ valeur, ...CATEGORIES_BLOG[valeur] }));
