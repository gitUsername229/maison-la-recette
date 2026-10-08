// Textes fixes des pages du site. Pour changer un texte : le modifier ici (le commentaire dit où il s’affiche),
// puis committer. Les pages de texte long (confidentialité, mentions légales) : une ligne qui commence par « ## »
// est un intertitre ; « avertissement » est le bandeau « texte à valider » (le vider une fois le texte validé).

export const TEXTES = {
  // Accueil (/)
  accueil: {
    /** Titre principal, sur la photo */
    slogan: 'Mieux manger, c’est déjà changer le monde',
    /** Phrase sous le titre */
    presentation: 'Écoutez La Recette, rencontrez celles et ceux qui changent notre assiette et vivez des ateliers qui ont du goût.',
    /** Bouton principal (vers le podcast) */
    boutonPodcast: 'Écouter le podcast',
    /** Second bouton (vers les offres entreprises) */
    boutonEntreprises: 'Voir les offres entreprises',
    /** Bloc podcast : bouton (vers tous les épisodes) */
    podcastBouton: 'Voir tous les épisodes',
    /** Bloc « Les expériences » : titre */
    experiencesBlocTitre: 'Les expériences',
    /** Bloc « Les expériences » : texte */
    experiencesBlocTexte: 'Ateliers culinaires, food tours et bien d’autres activités accessibles à tous.',
    /** Bloc « Les expériences » : bouton (vers toutes les expériences) */
    experiencesBouton: 'Voir toutes les expériences',
    /** Bloc « Pour les entreprises » : titre */
    entreprisesTitre: 'Pour les entreprises',
    /** Bloc « Pour les entreprises » : texte */
    entreprisesTexte: 'Organisons ensemble une activité adaptée à vos besoins : team building, sensibilisation, séminaire.',
    /** Bloc « Pour les entreprises », point 1 : titre */
    point1Titre: 'Sur mesure',
    /** Bloc « Pour les entreprises », point 1 : texte */
    point1Texte: 'Un format adapté à la taille et aux envies de votre équipe.',
    /** Bloc « Pour les entreprises », point 2 : titre */
    point2Titre: 'Clé en main',
    /** Bloc « Pour les entreprises », point 2 : texte */
    point2Texte: 'Nous gérons l’organisation, vous profitez du moment.',
    /** Bloc « Pour les entreprises », point 3 : titre */
    point3Titre: 'Responsable',
    /** Bloc « Pour les entreprises », point 3 : texte */
    point3Texte: 'Producteurs locaux, produits de saison, zéro gaspillage.',
    /** Bloc « Pour les entreprises » : bouton (vers les offres entreprises) */
    entreprisesBouton: 'En savoir plus',
    /** Bloc « Studio » : titre */
    studioBlocTitre: 'Studio de production',
    /** Bloc « Studio » : texte */
    studioBlocTexte: 'Vous avez un projet de podcast ? Maison La recette le produit pour vous, de l’idée à la diffusion.',
    /** Bloc « Studio » : bouton (vers le studio) */
    studioBouton: 'Découvrir le studio',
    /** Newsletter : titre */
    newsletterTitre: 'La newsletter',
    /** Newsletter : texte */
    newsletterAccroche: 'Un épisode, une idée, une date à retenir. Directement dans votre boîte mail.',
    /** Newsletter : bouton */
    newsletterBouton: 'S’inscrire',
  },
  // À propos (/a-propos)
  'a-propos': {
    /** Surtitre, au-dessus du titre */
    surtitre: 'Notre histoire & mission',
    /** Titre principal */
    titre: 'À propos de Maison La recette',
    /** Présentation */
    introduction: 'Fondée par Julie Van Ossel, Maison La recette est née d’une envie : reconnecter le grand public et les entreprises aux personnes qui nous nourrissent, à travers des récits sonores et des expériences culinaires vivantes.',
    /** Bloc « Expériences » : titre */
    experiencesTitre: 'Nos expériences',
    /** Bloc « Expériences » : texte */
    experiencesTexte: 'Des ateliers anti-gaspi, des food tours et des immersions pour mettre la main à la pâte.',
    /** Bloc « Expériences » : lien vers les expériences */
    experiencesBouton: 'Voir les ateliers',
    /** Bloc « Podcast » : titre */
    podcastTitre: 'Le podcast',
    /** Bloc « Podcast » : texte */
    podcastTexte: 'Des épisodes pour écouter les témoignages de chefs, maraîchers et artisans passionnés.',
    /** Bloc « Podcast » : lien vers le podcast */
    podcastBouton: 'Écouter le podcast',
    /** Titre des partenaires */
    partenairesTitre: 'Nos partenaires',
    /** Titre des avis clients */
    avisTitre: 'Ils en parlent',
    /** Titre de la galerie photos */
    galerieTitre: 'En images',
  },
  // Studio (/studio)
  studio: {
    /** Surtitre, au-dessus du titre */
    surtitre: 'Studio & Sponsoring B2B',
    /** Titre principal */
    titre: 'Studio de production',
    /** Présentation */
    introduction: 'Maison La recette conçoit et produit des récits audios authentiques pour les marques et organisations engagées autour de l’alimentation et du vivant.',
    /** Encadré : titre */
    projetTitre: 'Vous avez un projet audio ?',
    /** Encadré : texte */
    projetTexte: 'De l’écriture au mixage en passant par les interviews de vos équipes ou producteurs partenaires.',
    /** Encadré : bouton (vers la demande de devis) */
    bouton: 'Demander un devis studio',
  },
  // Expériences (/experiences et /experiences/entreprises)
  experiences: {
    /** Titre de la page */
    titre: 'Expériences',
    /** Onglet « Particuliers » */
    ongletParticuliers: 'Particuliers',
    /** Onglet « Entreprises » */
    ongletEntreprises: 'Entreprises',
    /** Particuliers : titre des expériences à venir */
    aVenirTitre: 'Expériences à venir',
    /** Message quand aucune expérience n’est proposée */
    aucuneExperience: 'Aucune expérience n’est proposée pour le moment.',
    /** Particuliers : titre des expériences passées (choix de l’année) */
    passeesTitre: 'Expériences passées',
    /** Particuliers : titre des avis */
    avisTitre: 'Ils en parlent',
    /** Entreprises : présentation */
    entreprisesIntroduction: 'Vous souhaitez organiser pour vos collaborateurs un atelier qui respecte vos valeurs RSE ? Vous êtes au bon endroit. Préparons ensemble un atelier adapté à vos besoins.',
    /** Entreprises : bouton (vers la demande de devis) */
    boutonDevis: 'Demander un devis',
  },
  // Blog (liste et blocs sous les articles)
  blog: {
    /** Surtitre, au-dessus du titre */
    surtitre: 'Blog & Conseils',
    /** Titre principal */
    titre: 'Le Blog',
    /** Présentation */
    introduction: 'Retrouvez ici nos articles, idées de recettes anti-gaspi et réflexions sur l’alimentation durable.',
    /** Onglet et lien « tous les articles » */
    tousLesArticles: 'Tous les articles',
    /** Message quand il n’y a pas encore d’article */
    aucunArticle: 'Les articles du blog sont en cours de rédaction.',
    /** Article : titre du bloc de l’épisode */
    episodeTitre: 'Écouter l’épisode',
    /** Article : bouton du lecteur */
    episodeBouton: 'Lancer la lecture',
    /** Article : lien vers le podcast */
    episodeLien: 'Tous les épisodes',
    /** Article : titre du bloc des expériences */
    experiencesTitre: 'Envie d’aller plus loin ?',
    /** Article : texte du bloc quand aucune expérience n’est liée */
    experiencesTexte: 'Ateliers, food tours et immersions : découvrez nos expériences autour de l’alimentation.',
    /** Article : lien vers toutes les expériences */
    experiencesBouton: 'Voir toutes les expériences',
    /** Article « Pour les entreprises » : titre de l’encadré */
    entreprisesTitre: 'Une expérience pour votre équipe ?',
    /** Article « Pour les entreprises » : texte de l’encadré */
    entreprisesTexte: 'Ateliers, food tours ou immersions : décrivez-nous votre projet, nous vous répondons avec une proposition adaptée.',
    /** Article « Pour les entreprises » : bouton (vers la demande de devis) */
    entreprisesBouton: 'Demander un devis',
  },
  // Politique de confidentialité (/confidentialite)
  confidentialite: {
    /** Titre */
    titre: 'Politique de confidentialité',
    /** Bandeau « texte à valider » (à vider une fois le texte validé) (peut rester vide) */
    avertissement: 'Texte de base, à compléter et à faire valider avant la mise en ligne.',
    /** Texte de la page (une ligne commençant par « ## » devient un intertitre) */
    contenu: `Cette page explique quelles données personnelles Maison La recette recueille sur ce site, pourquoi, et comment exercer vos droits.

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
  // Mentions légales (/mentions-legales)
  'mentions-legales': {
    /** Titre */
    titre: 'Mentions légales',
    /** Bandeau « texte à valider » (à vider une fois le texte validé) (peut rester vide) */
    avertissement: 'Texte de base, à compléter et à faire valider avant la mise en ligne.',
    /** Texte de la page (une ligne commençant par « ## » devient un intertitre) */
    contenu: `## Éditeur du site
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
} as const;

export type PageTextes = keyof typeof TEXTES;
