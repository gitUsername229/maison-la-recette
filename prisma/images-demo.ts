import type { PrismaClient } from '@prisma/client';

// Photos de démonstration (public/images/demo/, licence Unsplash, voir CREDITS.md) : provisoires, à remplacer
// par les vraies photos depuis /admin. Le seed les pose seulement là où il n'y a encore aucune photo.

const PHOTOS = {
  'atelier-legumes-colores': 'Des mains préparent des légumes colorés sur une table en bois',
  'marche-etal-legumes': 'Étal de marché : chou-fleur, brocolis, radis et oignons nouveaux',
  'producteur-betteraves': 'Un maraîcher tient une botte de betteraves dans son champ',
  'planche-tomates': 'Légumes coupés sur une planche, tomates et oignons nouveaux autour',
  'bol-partage': 'Deux mains se passent un bol de légumes',
  'tablee-plein-air': 'Une longue tablée dressée dans un jardin, en fin de journée',
  'panier-legumes-saison': 'Panier de tomates anciennes, courgettes et haricots',
  'carottes-fanes': 'Des mains coupent des carottes avec leurs fanes',
  'marche-radis-carottes': 'Radis, carottes et salades sur un étal de marché',
  'tomates-recolte': 'Deux mains tiennent un bol de tomates cerises tout juste récoltées',
  'herbes-ciselees': 'Des mains ciselent des herbes sur une planche',
  'potager': 'Un potager en rangs, entre légumes et fleurs',
} as const;

type Photo = keyof typeof PHOTOS;

export const NOMS_PHOTOS_DEMO = Object.keys(PHOTOS) as Photo[];

const photo = (nom: Photo) => ({ url: `/images/demo/${nom}.jpg`, alt: PHOTOS[nom] });

/** Couvertures des expériences et des articles du seed (par slug). */
const COUVERTURES: { experiences: Record<string, Photo>; articles: Record<string, Photo> } = {
  experiences: {
    'atelier-cuisine-anti-gaspi': 'planche-tomates',
    'good-tour-marche-producteurs': 'marche-etal-legumes',
    'immersion-producteur': 'producteur-betteraves',
  },
  articles: {
    'retour-atelier-cuisine-anti-gaspi': 'herbes-ciselees',
    'dans-les-coulisses-d-un-episode': 'bol-partage',
    'une-experience-culinaire-pour-votre-equipe': 'tablee-plein-air',
  },
};

/** Galeries par page ; la première photo de l'accueil sert aussi d'image principale. */
const GALERIES: Record<string, Photo[]> = {
  '/': ['atelier-legumes-colores', 'panier-legumes-saison', 'carottes-fanes', 'marche-radis-carottes'],
  '/a-propos': ['tomates-recolte', 'potager', 'carottes-fanes'],
  '/experiences/atelier-cuisine-anti-gaspi': ['herbes-ciselees', 'carottes-fanes'],
  '/experiences/good-tour-marche-producteurs': ['marche-radis-carottes', 'panier-legumes-saison'],
  '/experiences/immersion-producteur': ['tomates-recolte', 'potager'],
};

/** Pose les photos de démonstration : couvertures encore vides et pages sans galerie. Rien n'est remplacé. */
export async function poserPhotosDemo(prisma: PrismaClient) {
  let couvertures = 0;
  for (const [slug, nom] of Object.entries(COUVERTURES.experiences)) {
    const { url, alt } = photo(nom);
    couvertures += (await prisma.experience.updateMany({ where: { slug, image: '' }, data: { image: url, imageAlt: alt } })).count;
  }
  for (const [slug, nom] of Object.entries(COUVERTURES.articles)) {
    const { url, alt } = photo(nom);
    couvertures += (await prisma.article.updateMany({ where: { slug, image: '' }, data: { image: url, imageAlt: alt } })).count;
  }

  let galeries = 0;
  for (const [page, noms] of Object.entries(GALERIES)) {
    if (await prisma.image.count({ where: { page } })) continue;
    await prisma.image.createMany({ data: noms.map((nom, ordre) => ({ ...photo(nom), page, ordre })) });
    galeries++;
  }
  return { couvertures, galeries };
}
