import type { PrismaClient } from '@prisma/client';

// Textes fixes des pages, modifiables par Julie dans /admin/textes. Ce fichier est la seule source :
// le seed les crée en base avec ces textes d'origine, et les pages les affichent tant qu'ils n'y sont pas.
// Ajouter un emplacement : l'ajouter ici, puis l'afficher dans la page (src/frontend/pages/).

/**
 * Forme du texte : fixe le champ de saisie et la longueur maximale. « long » : texte d'une page entière
 * (mentions légales, confidentialité), où une ligne commençant par « ## » est un intertitre.
 */
export type FormatTexte = 'titre' | 'paragraphe' | 'bouton' | 'long';

export const LONGUEUR_MAX: Record<FormatTexte, number> = { titre: 120, paragraphe: 1000, bouton: 40, long: 20_000 };

/** Bandeau des pages légales tant que la cliente n'a pas validé leur texte (à vider ensuite). */
const A_VALIDER = 'Texte de base, à compléter et à faire valider avant la mise en ligne.';

type Definition = { libelle: string; format: FormatTexte; texte: string; facultatif?: boolean };

export const TEXTES_PAR_DEFAUT = {
  accueil: {
    surtitre: { libelle: 'Surtitre, au-dessus du titre', format: 'titre', texte: 'Podcast · Expériences · Studio' },
    titre: { libelle: 'Titre principal', format: 'titre', texte: 'Maison La recette' },
    introduction: { libelle: 'Phrase de présentation', format: 'paragraphe', texte: 'Un lieu de rencontres, d’histoires et d’expériences autour de l’alimentation.' },
    bouton: { libelle: 'Lien vers les expériences (sous le bouton principal)', format: 'bouton', texte: 'Réserver une expérience' },
    boutonPodcast: { libelle: 'Bouton principal (vers le podcast)', format: 'bouton', texte: 'Écouter le podcast' },
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
  experiences: {
    titre: { libelle: 'Titre de la page', format: 'titre', texte: 'Expériences' },
    introduction: { libelle: 'Présentation', format: 'paragraphe', texte: 'Ateliers, good tours et immersions pour se retrouver autour de ce qui nous nourrit.' },
    ongletParticuliers: { libelle: 'Onglet « Particuliers »', format: 'bouton', texte: 'Particuliers' },
    ongletEntreprises: { libelle: 'Onglet « Entreprises »', format: 'bouton', texte: 'Entreprises' },
    aucuneExperience: { libelle: 'Message quand aucune expérience n’est proposée', format: 'paragraphe', texte: 'Aucune expérience n’est proposée pour le moment.' },
    entreprisesTitre: { libelle: 'Entreprises : question d’accroche', format: 'titre', texte: 'Besoin d’organiser un atelier enrichissant pour vos collaborateurs ?' },
    entreprisesTexte: { libelle: 'Entreprises : présentation du sur-mesure', format: 'paragraphe', texte: 'Ateliers, good tours et immersions se construisent sur mesure pour votre équipe : format, nombre de participants, date et lieu.' },
    formatsTitre: { libelle: 'Entreprises : titre des formats (photos)', format: 'titre', texte: 'Nos formats' },
    etapesTitre: { libelle: 'Entreprises : titre du déroulé', format: 'titre', texte: 'Comment ça se passe ?' },
    etape1Titre: { libelle: 'Déroulé, étape 1 : titre', format: 'titre', texte: 'Vous décrivez votre projet' },
    etape1Texte: { libelle: 'Déroulé, étape 1 : texte', format: 'paragraphe', texte: 'En quelques lignes, avec le formulaire de demande de devis.' },
    etape2Titre: { libelle: 'Déroulé, étape 2 : titre', format: 'titre', texte: 'Julie vous appelle' },
    etape2Texte: { libelle: 'Déroulé, étape 2 : texte', format: 'paragraphe', texte: 'Pour comprendre vos envies, votre équipe et vos contraintes.' },
    etape3Titre: { libelle: 'Déroulé, étape 3 : titre', format: 'titre', texte: 'Une proposition sous 48 h' },
    etape3Texte: { libelle: 'Déroulé, étape 3 : texte', format: 'paragraphe', texte: 'Une proposition sur mesure après notre échange, à ajuster ensemble.' },
    avisTitre: { libelle: 'Entreprises : titre des avis', format: 'titre', texte: 'Ils en parlent' },
    encartTitre: { libelle: 'Entreprises : texte de l’encart devis', format: 'paragraphe', texte: 'Vous êtes une entreprise et souhaitez organiser un atelier ?' },
    bouton: { libelle: 'Entreprises : bouton (vers la demande de devis)', format: 'bouton', texte: 'Obtenir un devis' },
  },
  blog: {
    surtitre: { libelle: 'Surtitre, au-dessus du titre', format: 'titre', texte: 'Blog & Conseils' },
    titre: { libelle: 'Titre principal', format: 'titre', texte: 'Le Blog' },
    introduction: { libelle: 'Présentation', format: 'paragraphe', texte: 'Retrouvez ici nos articles, idées de recettes anti-gaspi et réflexions sur l’alimentation durable.' },
    tousLesArticles: { libelle: 'Onglet et lien « tous les articles »', format: 'bouton', texte: 'Tous les articles' },
    aucunArticle: { libelle: 'Message quand il n’y a pas encore d’article', format: 'paragraphe', texte: 'Les articles du blog sont en cours de rédaction.' },
    episodeTitre: { libelle: 'Article : titre du bloc de l’épisode', format: 'titre', texte: 'Écouter l’épisode' },
    episodeBouton: { libelle: 'Article : bouton du lecteur', format: 'bouton', texte: 'Lancer la lecture' },
    episodeLien: { libelle: 'Article : lien vers le podcast', format: 'bouton', texte: 'Tous les épisodes' },
    experiencesTitre: { libelle: 'Article : titre du bloc des expériences', format: 'titre', texte: 'Envie d’aller plus loin ?' },
    experiencesTexte: { libelle: 'Article : texte du bloc quand aucune expérience n’est liée', format: 'paragraphe', texte: 'Ateliers, good tours et immersions : découvrez nos expériences autour de l’alimentation.' },
    experiencesBouton: { libelle: 'Article : lien vers toutes les expériences', format: 'bouton', texte: 'Voir toutes les expériences' },
    entreprisesTitre: { libelle: 'Article « Pour les entreprises » : titre de l’encadré', format: 'titre', texte: 'Une expérience pour votre équipe ?' },
    entreprisesTexte: { libelle: 'Article « Pour les entreprises » : texte de l’encadré', format: 'paragraphe', texte: 'Ateliers, good tours ou immersions : décrivez-nous votre projet, nous vous répondons avec une proposition adaptée.' },
    entreprisesBouton: { libelle: 'Article « Pour les entreprises » : bouton (vers la demande de devis)', format: 'bouton', texte: 'Demander un devis' },
  },
  confidentialite: {
    titre: { libelle: 'Titre', format: 'titre', texte: 'Politique de confidentialité' },
    avertissement: { libelle: 'Bandeau « texte à valider » (à vider une fois le texte validé)', format: 'paragraphe', texte: A_VALIDER, facultatif: true },
    contenu: {
      libelle: 'Texte de la page (une ligne commençant par « ## » devient un intertitre)', format: 'long',
      texte: `Cette page explique quelles données personnelles Maison La recette recueille sur ce site, pourquoi, et comment exercer vos droits.

## Qui est responsable de vos données ?
Maison La recette, [forme juridique, adresse et numéro SIRET à compléter].
Contact : larecette@ecomail.fr

## Quelles données, et pour quoi faire ?
Réservation d’une expérience : nom, adresse e-mail, téléphone (facultatif) et nombre de participants, pour enregistrer votre réservation, vous envoyer sa confirmation et vous prévenir en cas d’imprévu.
Demande de devis : nom, entreprise, adresse e-mail, téléphone et description de votre projet, pour vous rappeler et vous faire une proposition.
Newsletter : adresse e-mail, pour vous envoyer la newsletter jusqu’à votre désinscription.
Nous gardons aussi la date à laquelle vous avez accepté cette politique. Le site ne vous demande jamais de créer un compte.

## Paiement
Le paiement par carte est traité par Stripe. Maison La recette ne voit ni ne conserve vos numéros de carte.

## Qui a accès à vos données ?
L’équipe de Maison La recette uniquement, et ses prestataires techniques pour ce qui les concerne : hébergement du site [à compléter], envoi des e-mails [à compléter], paiement (Stripe). Vos données ne sont jamais vendues ni cédées.

## Combien de temps sont-elles conservées ?
[À compléter, par exemple : réservations et demandes de devis, 3 ans après le dernier contact ; pièces comptables, 10 ans ; newsletter, jusqu’à la désinscription.]

## Cookies
Le site n’utilise ni cookie publicitaire ni mesure d’audience. Un cookie technique sert uniquement à la connexion de l’équipe à l’administration. [À vérifier : cookies déposés par le lecteur du podcast Ausha lorsqu’il est affiché.]

## Vos droits
Vous pouvez demander à consulter, corriger ou supprimer vos données, ou vous opposer à leur utilisation, en écrivant à larecette@ecomail.fr. Vous pouvez vous désinscrire de la newsletter à tout moment. En cas de difficulté, vous pouvez adresser une réclamation à la CNIL (www.cnil.fr).`,
    },
  },
  'mentions-legales': {
    titre: { libelle: 'Titre', format: 'titre', texte: 'Mentions légales' },
    avertissement: { libelle: 'Bandeau « texte à valider » (à vider une fois le texte validé)', format: 'paragraphe', texte: A_VALIDER, facultatif: true },
    contenu: {
      libelle: 'Texte de la page (une ligne commençant par « ## » devient un intertitre)', format: 'long',
      texte: `## Éditeur du site
Maison La recette, [forme juridique, capital, adresse du siège et numéro SIRET ou RCS à compléter].
Responsable de la publication : [nom à compléter].
Contact : larecette@ecomail.fr

## Hébergement
[Nom, adresse et téléphone de l’hébergeur à compléter.]

## Propriété intellectuelle
Les textes, photos, logos et épisodes du podcast présentés sur ce site appartiennent à Maison La recette ou à leurs auteurs. Toute reproduction sans autorisation est interdite.

## Crédits
Photos de démonstration : Unsplash (provisoires, à remplacer).

## Données personnelles
Pour savoir quelles données sont recueillies et comment exercer vos droits, consultez la politique de confidentialité.`,
    },
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
