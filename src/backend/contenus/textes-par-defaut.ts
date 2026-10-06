import type { PrismaClient } from '@prisma/client';

// Textes fixes des pages, modifiables par Julie dans /admin/textes. Ce fichier est la seule source :
// le seed les crée en base avec ces textes d'origine, et les pages les affichent tant qu'ils n'y sont pas.
// Ajouter un emplacement : l'ajouter ici, puis l'afficher dans la page (src/frontend/pages/).

/** Forme du texte : fixe le champ de saisie et la longueur maximale. */
export type FormatTexte = 'titre' | 'paragraphe' | 'bouton';

export const LONGUEUR_MAX: Record<FormatTexte, number> = { titre: 120, paragraphe: 1000, bouton: 40 };

type Definition = { libelle: string; format: FormatTexte; texte: string; facultatif?: boolean };

export const TEXTES_PAR_DEFAUT = {
  accueil: {
    surtitre: { libelle: 'Surtitre, au-dessus du titre', format: 'titre', texte: 'Podcast · Expériences · Studio' },
    titre: { libelle: 'Titre principal', format: 'titre', texte: 'Maison La recette' },
    introduction: { libelle: 'Phrase de présentation', format: 'paragraphe', texte: 'Un lieu de rencontres, d’histoires et d’expériences autour de l’alimentation.' },
    bouton: { libelle: 'Bouton principal (vers les expériences)', format: 'bouton', texte: 'Réserver une expérience' },
    podcastTitre: { libelle: 'Bloc « Podcast » : titre', format: 'titre', texte: 'Podcast' },
    podcastTexte: { libelle: 'Bloc « Podcast » : texte', format: 'paragraphe', texte: 'Des voix et des histoires autour de ce qui nous nourrit.' },
    experiencesTitre: { libelle: 'Bloc « Expériences » : titre (lien vers les expériences)', format: 'titre', texte: 'Expériences' },
    experiencesTexte: { libelle: 'Bloc « Expériences » : texte', format: 'paragraphe', texte: 'Ateliers, good tours et immersions pour se retrouver.' },
    studioTitre: { libelle: 'Bloc « Studio » : titre', format: 'titre', texte: 'Studio' },
    studioTexte: { libelle: 'Bloc « Studio » : texte', format: 'paragraphe', texte: 'Des podcasts à imaginer et à produire pour les marques.' },
    avisTitre: { libelle: 'Titre des avis clients', format: 'titre', texte: 'Ils en parlent' },
    galerieTitre: { libelle: 'Titre de la galerie photos', format: 'titre', texte: 'En images' },
    newsletterTitre: { libelle: 'Newsletter : titre', format: 'titre', texte: 'La newsletter' },
    newsletterTexte: { libelle: 'Newsletter : texte', format: 'paragraphe', texte: 'Les nouveaux épisodes, ateliers et good tours, une fois par mois.' },
    newsletterBouton: { libelle: 'Newsletter : bouton', format: 'bouton', texte: 'S’inscrire' },
    mention: { libelle: 'Mention en bas de page', format: 'paragraphe', texte: 'Le site est en préparation.', facultatif: true },
  },
  'a-propos': {
    surtitre: { libelle: 'Surtitre, au-dessus du titre', format: 'titre', texte: 'Notre histoire & mission' },
    titre: { libelle: 'Titre principal', format: 'titre', texte: 'À propos de Maison La recette' },
    introduction: { libelle: 'Présentation', format: 'paragraphe', texte: 'Fondée par Julie Van Ossel, Maison La recette est née d’une envie : reconnecter le grand public et les entreprises aux personnes qui nous nourrissent, à travers des récits sonores et des expériences culinaires vivantes.' },
    experiencesTitre: { libelle: 'Bloc « Expériences » : titre', format: 'titre', texte: 'Nos expériences' },
    experiencesTexte: { libelle: 'Bloc « Expériences » : texte', format: 'paragraphe', texte: 'Des ateliers anti-gaspi, des good tours et des immersions pour mettre la main à la pâte.' },
    experiencesBouton: { libelle: 'Bloc « Expériences » : lien vers les expériences', format: 'bouton', texte: 'Voir les ateliers' },
    podcastTitre: { libelle: 'Bloc « Podcast » : titre', format: 'titre', texte: 'Le podcast' },
    podcastTexte: { libelle: 'Bloc « Podcast » : texte', format: 'paragraphe', texte: 'Des épisodes pour écouter les témoignages de chefs, maraîchers et artisans passionnés.' },
    podcastBouton: { libelle: 'Bloc « Podcast » : lien vers le podcast', format: 'bouton', texte: 'Écouter le podcast' },
    partenairesTitre: { libelle: 'Titre des partenaires', format: 'titre', texte: 'Nos partenaires' },
    avisTitre: { libelle: 'Titre des avis clients', format: 'titre', texte: 'Ils en parlent' },
    galerieTitre: { libelle: 'Titre de la galerie photos', format: 'titre', texte: 'En images' },
  },
  studio: {
    surtitre: { libelle: 'Surtitre, au-dessus du titre', format: 'titre', texte: 'Studio & Sponsoring B2B' },
    titre: { libelle: 'Titre principal', format: 'titre', texte: 'Studio de production' },
    introduction: { libelle: 'Présentation', format: 'paragraphe', texte: 'Maison La recette conçoit et produit des récits audios authentiques pour les marques et organisations engagées autour de l’alimentation et du vivant.' },
    projetTitre: { libelle: 'Encadré : titre', format: 'titre', texte: 'Vous avez un projet audio ?' },
    projetTexte: { libelle: 'Encadré : texte', format: 'paragraphe', texte: 'De l’écriture au mixage en passant par les interviews de vos équipes ou producteurs partenaires.' },
    bouton: { libelle: 'Encadré : bouton (vers la demande de devis)', format: 'bouton', texte: 'Demander un devis studio' },
  },
} as const satisfies Record<string, Record<string, Definition>>;

export type PageTextes = keyof typeof TEXTES_PAR_DEFAUT;

/** Les textes d'une page, par emplacement : { titre: '…', introduction: '…' }. */
export type TextesDe<P extends PageTextes> = Record<keyof (typeof TEXTES_PAR_DEFAUT)[P], string>;

export type EmplacementTexte = Definition & { page: PageTextes; cle: string; ordre: number };

/** Tous les emplacements, dans l'ordre des pages. */
export const EMPLACEMENTS: EmplacementTexte[] = Object.entries(TEXTES_PAR_DEFAUT).flatMap(([page, textes]) =>
  Object.entries(textes).map(([cle, definition]: [string, Definition], ordre) => ({ ...definition, page: page as PageTextes, cle, ordre })));

export const estPageTextes = (page: string): page is PageTextes => Object.hasOwn(TEXTES_PAR_DEFAUT, page);

export const emplacement = (page: string, cle: string) => EMPLACEMENTS.find(e => e.page === page && e.cle === cle);

/** Crée en base les textes absents, avec leur texte d'origine. Un texte déjà en base (modifié par Julie) n'est jamais remplacé. */
export async function creerTextesManquants(prisma: PrismaClient) {
  const existants = new Set((await prisma.textePage.findMany({ select: { page: true, cle: true } })).map(t => `${t.page}/${t.cle}`));
  const manquants = EMPLACEMENTS.filter(e => !existants.has(`${e.page}/${e.cle}`)).map(({ page, cle, texte }) => ({ page, cle, texte }));
  if (manquants.length) await prisma.textePage.createMany({ data: manquants });
  return manquants.length;
}
