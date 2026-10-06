import {
  LIEUX_DEVIS, ROLES, STATUTS_DEVIS, STATUTS_RESERVATION, STATUTS_SESSION, TYPES_DEVIS, TYPES_EXPERIENCE, type Libelles,
} from '@/frontend/format';

// Description des écrans d'administration : une entrée par ressource, affichée par
// TableauRessource (liste + actions) et FormulaireRessource (création / modification).

export type TypeChamp = 'texte' | 'texteLong' | 'nombre' | 'prix' | 'booleen' | 'date' | 'dateHeure' | 'liste' | 'image' | 'experience';

export type ChampAdmin = {
  nom: string;
  libelle: string;
  type: TypeChamp;
  requis?: boolean;
  aide?: string;
  options?: Libelles;          // type « liste »
  defaut?: string | boolean;   // valeur proposée à la création
  nullable?: boolean;          // laissé vide → effacé (null)
  creationSeulement?: boolean; // non modifiable ensuite
};

export type FormatColonne = 'texte' | 'date' | 'dateHeure' | 'prix' | 'booleen' | 'image' | 'statut';

export type ColonneAdmin = {
  libelle: string;
  chemin: string;              // ex : « session.experience.titre »
  format?: FormatColonne;
  libelles?: Libelles;         // valeur en base → texte affiché
  complements?: string[];      // autres valeurs affichées en petit dessous (ex : e-mail, téléphone)
};

export type RessourceAdmin = {
  cle: string;                 // /admin/<cle>
  titre: string;
  singulier: string;           // « une expérience »
  description: string;
  api: string;
  colonnes: ColonneAdmin[];
  champs?: ChampAdmin[];       // présents → création et modification
  creation?: boolean;          // false : modification seulement
  methodeModification?: 'PUT' | 'PATCH';
  suppression?: boolean;
  statut?: { champ: string; options: Libelles };        // statut modifiable dans la liste
  filtre?: { parametre: string; options: Libelles };    // filtre de la liste (?statut=…)
  annulation?: boolean;        // bouton « Annuler » (réservations)
};

const visible = (aide: string, defaut: boolean): ChampAdmin => ({ nom: 'visible', libelle: 'Visible sur le site', type: 'booleen', aide, defaut });

export const RESSOURCES_ADMIN: RessourceAdmin[] = [
  {
    cle: 'reservations', titre: 'Réservations', singulier: 'une réservation', api: '/api/reservations',
    description: 'Les réservations payées en ligne. Annuler une réservation payée demande d’abord de la rembourser dans Stripe.',
    colonnes: [
      { libelle: 'N°', chemin: 'id' },
      { libelle: 'Expérience', chemin: 'session.experience.titre' },
      { libelle: 'Date', chemin: 'session.dateDebut', format: 'dateHeure' },
      { libelle: 'Client', chemin: 'nom', complements: ['email', 'telephone'] },
      { libelle: 'Personnes', chemin: 'nbPersonnes' },
      { libelle: 'Montant', chemin: 'montantCents', format: 'prix' },
      { libelle: 'Statut', chemin: 'statut', format: 'statut', libelles: STATUTS_RESERVATION },
    ],
    filtre: { parametre: 'statut', options: STATUTS_RESERVATION },
    annulation: true,
  },
  {
    cle: 'devis', titre: 'Demandes de devis', singulier: 'une demande', api: '/api/devis',
    description: 'Les demandes des entreprises et des groupes. Passez-les « en cours » quand vous les traitez.',
    colonnes: [
      { libelle: 'Reçue le', chemin: 'createdAt', format: 'date' },
      { libelle: 'Entreprise', chemin: 'entreprise' },
      { libelle: 'Contact', chemin: 'contactNom', complements: ['email', 'telephone'] },
      { libelle: 'Demande', chemin: 'typeDemande', libelles: TYPES_DEVIS, complements: ['experience.titre'] },
      { libelle: 'Participants', chemin: 'nbParticipants' },
      { libelle: 'Date souhaitée', chemin: 'dateSouhaitee', format: 'date' },
      { libelle: 'Lieu', chemin: 'lieuSouhaite', libelles: LIEUX_DEVIS },
      { libelle: 'Message', chemin: 'message' },
    ],
    statut: { champ: 'statut', options: STATUTS_DEVIS },
    filtre: { parametre: 'statut', options: STATUTS_DEVIS },
  },
  {
    cle: 'experiences', titre: 'Expériences', singulier: 'une expérience', api: '/api/experiences',
    description: 'Ateliers, good tours et immersions. Décochez « Visible » pour masquer une expérience sans la supprimer.',
    colonnes: [
      { libelle: 'Titre', chemin: 'titre' },
      { libelle: 'Type', chemin: 'type', libelles: TYPES_EXPERIENCE },
      { libelle: 'Prix / pers.', chemin: 'prixCents', format: 'prix' },
      { libelle: 'Réservable en ligne', chemin: 'reservableEnLigne', format: 'booleen' },
      { libelle: 'Visible', chemin: 'actif', format: 'booleen' },
    ],
    champs: [
      { nom: 'titre', libelle: 'Titre', type: 'texte', requis: true },
      { nom: 'slug', libelle: 'Adresse de la page', type: 'texte', requis: true, aide: 'Devient /experiences/<adresse>. Minuscules, chiffres et tirets, ex : atelier-pain-perdu.' },
      { nom: 'type', libelle: 'Type', type: 'liste', options: TYPES_EXPERIENCE, requis: true },
      { nom: 'accroche', libelle: 'Accroche', type: 'texte', requis: true, aide: 'Une phrase courte, affichée sur les cartes.' },
      { nom: 'description', libelle: 'Description', type: 'texteLong', requis: true },
      { nom: 'dureeMin', libelle: 'Durée (minutes)', type: 'nombre', requis: true },
      { nom: 'prixCents', libelle: 'Prix par personne (€)', type: 'prix', requis: true },
      { nom: 'prixEntrepriseCents', libelle: 'Prix entreprise par personne (€)', type: 'prix', nullable: true, aide: 'Facultatif.' },
      { nom: 'capaciteMax', libelle: 'Participants maximum', type: 'nombre', requis: true },
      { nom: 'lieu', libelle: 'Lieu habituel', type: 'texte', nullable: true },
      { nom: 'image', libelle: 'Photo de couverture', type: 'image' },
      { nom: 'imageAlt', libelle: 'Description de la photo', type: 'texte', aide: 'Lue aux personnes malvoyantes, ex : « Mains qui pétrissent une pâte ».' },
      { nom: 'reservableEnLigne', libelle: 'Réservable et payable en ligne', type: 'booleen', defaut: true, aide: 'Décoché : sur devis uniquement (immersions).' },
      { nom: 'actif', libelle: 'Visible sur le site', type: 'booleen', defaut: true },
    ],
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'sessions', titre: 'Sessions', singulier: 'une session', api: '/api/sessions',
    description: 'Les dates de chaque expérience. Passez une session en « Annulée » pour la retirer du site.',
    colonnes: [
      { libelle: 'Expérience', chemin: 'experience.titre' },
      { libelle: 'Début', chemin: 'dateDebut', format: 'dateHeure' },
      { libelle: 'Lieu', chemin: 'lieu' },
      { libelle: 'Places prises', chemin: 'placesPrises' },
      { libelle: 'Places', chemin: 'placesTotal' },
      { libelle: 'Prix spécifique', chemin: 'prixCents', format: 'prix' },
      { libelle: 'Statut', chemin: 'statut', format: 'statut', libelles: STATUTS_SESSION },
    ],
    champs: [
      { nom: 'experienceId', libelle: 'Expérience', type: 'experience', requis: true, creationSeulement: true },
      { nom: 'dateDebut', libelle: 'Début', type: 'dateHeure', requis: true },
      { nom: 'dateFin', libelle: 'Fin', type: 'dateHeure', requis: true },
      { nom: 'lieu', libelle: 'Lieu', type: 'texte', requis: true },
      { nom: 'placesTotal', libelle: 'Nombre de places', type: 'nombre', requis: true },
      { nom: 'prixCents', libelle: 'Prix par personne (€)', type: 'prix', nullable: true, aide: 'Vide : prix de l’expérience.' },
      { nom: 'statut', libelle: 'Statut', type: 'liste', options: STATUTS_SESSION, defaut: 'ouverte' },
    ],
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'photos', titre: 'Photos', singulier: 'une photo', api: '/api/images',
    description: 'Les galeries photos. Choisissez la page qui affiche la photo et son ordre.',
    colonnes: [
      { libelle: 'Aperçu', chemin: 'url', format: 'image' },
      { libelle: 'Description', chemin: 'alt' },
      { libelle: 'Page', chemin: 'page' },
      { libelle: 'Ordre', chemin: 'ordre' },
    ],
    champs: [
      { nom: 'url', libelle: 'Photo', type: 'image', requis: true },
      { nom: 'alt', libelle: 'Description de la photo', type: 'texte', requis: true, aide: 'Lue aux personnes malvoyantes.' },
      { nom: 'page', libelle: 'Page', type: 'texte', requis: true, aide: 'Ex : / (accueil), /a-propos, /experiences/atelier-cuisine-anti-gaspi.' },
      { nom: 'ordre', libelle: 'Ordre dans la galerie', type: 'nombre', defaut: '0' },
    ],
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'episodes', titre: 'Épisodes du podcast', singulier: 'un épisode', api: '/api/episodes',
    description: 'Les épisodes du podcast La recette, avec leurs liens d’écoute.',
    colonnes: [
      { libelle: 'Saison', chemin: 'saison' },
      { libelle: 'N°', chemin: 'numero' },
      { libelle: 'Titre', chemin: 'titre' },
      { libelle: 'Publié le', chemin: 'datePublication', format: 'date' },
      { libelle: 'Invité', chemin: 'invite' },
    ],
    champs: [
      { nom: 'saison', libelle: 'Saison', type: 'nombre', requis: true, defaut: '1' },
      { nom: 'numero', libelle: 'Numéro', type: 'nombre', requis: true },
      { nom: 'titre', libelle: 'Titre', type: 'texte', requis: true },
      { nom: 'invite', libelle: 'Invité', type: 'texte', nullable: true },
      { nom: 'datePublication', libelle: 'Date de publication', type: 'date', requis: true },
      { nom: 'dureeMin', libelle: 'Durée (minutes)', type: 'nombre', requis: true },
      { nom: 'resume', libelle: 'Résumé affiché sur le site', type: 'texteLong' },
      { nom: 'description', libelle: 'Description complète', type: 'texteLong', requis: true },
      { nom: 'image', libelle: 'Visuel (lien)', type: 'texte', requis: true, aide: 'Lien du visuel Ausha, ou /images/… pour une photo envoyée.' },
      { nom: 'embedUrl', libelle: 'Lien du lecteur Ausha', type: 'texte', requis: true },
      { nom: 'spotifyUrl', libelle: 'Lien Spotify', type: 'texte', nullable: true },
      { nom: 'deezerUrl', libelle: 'Lien Deezer', type: 'texte', nullable: true },
      { nom: 'appleUrl', libelle: 'Lien Apple Podcasts', type: 'texte', nullable: true },
      { nom: 'youtubeUrl', libelle: 'Lien YouTube', type: 'texte', nullable: true },
    ],
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'articles', titre: 'Articles du blog', singulier: 'un article', api: '/api/articles',
    description: 'Les articles du blog. Un article non publié reste un brouillon invisible sur le site.',
    colonnes: [
      { libelle: 'Titre', chemin: 'titre' },
      { libelle: 'Date', chemin: 'datePublication', format: 'date' },
      { libelle: 'Publié', chemin: 'publie', format: 'booleen' },
    ],
    champs: [
      { nom: 'titre', libelle: 'Titre', type: 'texte', requis: true },
      { nom: 'slug', libelle: 'Adresse de la page', type: 'texte', requis: true, aide: 'Devient /blog/<adresse>. Minuscules, chiffres et tirets.' },
      { nom: 'extrait', libelle: 'Extrait', type: 'texte', requis: true, aide: 'Résumé court, affiché dans la liste et sur les moteurs de recherche.' },
      { nom: 'contenu', libelle: 'Contenu', type: 'texteLong', requis: true, aide: 'Mise en forme Markdown : **gras**, ## Titre, - liste.' },
      { nom: 'image', libelle: 'Photo de couverture', type: 'image' },
      { nom: 'imageAlt', libelle: 'Description de la photo', type: 'texte' },
      { nom: 'datePublication', libelle: 'Date de publication', type: 'date' },
      { nom: 'publie', libelle: 'Publié', type: 'booleen', defaut: false },
    ],
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'avis', titre: 'Avis clients', singulier: 'un avis', api: '/api/avis',
    description: 'Les témoignages affichés sur le site.',
    colonnes: [
      { libelle: 'Nom', chemin: 'nom' },
      { libelle: 'Contexte', chemin: 'contexte' },
      { libelle: 'Note', chemin: 'note' },
      { libelle: 'Visible', chemin: 'visible', format: 'booleen' },
    ],
    champs: [
      { nom: 'nom', libelle: 'Nom', type: 'texte', requis: true, aide: 'Ex : Claire D.' },
      { nom: 'citation', libelle: 'Témoignage', type: 'texteLong', requis: true },
      { nom: 'contexte', libelle: 'Contexte', type: 'texte', requis: true, aide: 'Ex : Team building, atelier anti-gaspi.' },
      { nom: 'note', libelle: 'Note sur 5', type: 'nombre', nullable: true, aide: 'Facultatif.' },
      visible('Décochez pour masquer l’avis.', true),
    ],
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'partenaires', titre: 'Partenaires', singulier: 'un partenaire', api: '/api/partenaires',
    description: 'Producteurs et artisans partenaires, affichés seulement après leur accord.',
    colonnes: [
      { libelle: 'Photo', chemin: 'photo', format: 'image' },
      { libelle: 'Nom', chemin: 'nom' },
      { libelle: 'Métier', chemin: 'metier' },
      { libelle: 'Visible', chemin: 'visible', format: 'booleen' },
    ],
    champs: [
      { nom: 'nom', libelle: 'Nom', type: 'texte', requis: true },
      { nom: 'metier', libelle: 'Métier', type: 'texte', requis: true, aide: 'Ex : Maraîchère, Chef, Brasseur.' },
      { nom: 'photo', libelle: 'Photo', type: 'image' },
      { nom: 'photoAlt', libelle: 'Description de la photo', type: 'texte' },
      { nom: 'description', libelle: 'Présentation', type: 'texteLong', requis: true },
      visible('À cocher seulement après l’accord du partenaire.', false),
    ],
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'utilisateurs', titre: 'Utilisateurs', singulier: 'un utilisateur', api: '/api/utilisateurs',
    description: 'Les comptes du site. Le rôle « Administration » donne accès à cet espace. Supprimer un compte conserve ses réservations et ses devis.',
    colonnes: [
      { libelle: 'Nom', chemin: 'nom', complements: ['email', 'telephone'] },
      { libelle: 'Rôle', chemin: 'role', libelles: ROLES },
      { libelle: 'E-mail vérifié', chemin: 'emailVerified', format: 'booleen' },
      { libelle: 'Réservations', chemin: '_count.reservations' },
      { libelle: 'Devis', chemin: '_count.demandesDevis' },
      { libelle: 'Inscrit le', chemin: 'createdAt', format: 'date' },
    ],
    champs: [
      { nom: 'nom', libelle: 'Nom', type: 'texte', requis: true },
      { nom: 'telephone', libelle: 'Téléphone', type: 'texte', nullable: true },
      { nom: 'role', libelle: 'Rôle', type: 'liste', options: ROLES, requis: true },
    ],
    creation: false, methodeModification: 'PATCH', suppression: true,
  },
];

export const ressourceAdmin = (cle: string) => RESSOURCES_ADMIN.find(r => r.cle === cle);
