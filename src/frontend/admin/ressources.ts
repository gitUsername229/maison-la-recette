import {
  formatDate, formatDateHeure, libelle, LIEUX_DEVIS, STATUTS_DEVIS, STATUTS_RESERVATION, STATUTS_SESSION, TYPES_DEVIS, TYPES_EPISODE, TYPES_EXPERIENCE, type Libelles,
} from '@/frontend/format';
import { lire, type Ligne } from './valeurs';

// Description des écrans d'administration : une entrée par ressource, affichée par
// TableauRessource (liste + actions) et FormulaireRessource (création / modification).

export type TypeChamp = 'texte' | 'texteLong' | 'nombre' | 'prix' | 'booleen' | 'date' | 'dateHeure' | 'liste' | 'listeMultiple' | 'image';

/** Un élément renvoyé par une route /api (expérience, épisode, catégorie…). */
export type ElementApi = Record<string, unknown>;

/** Options lues dans une route /api : une option par élément renvoyé, après d'éventuelles options fixes. */
export type SourceOptions = {
  api: string;
  valeur: (element: ElementApi) => string;
  libelle: (element: ElementApi) => string;
  fixes?: Libelles;            // proposées avant celles de l'API (ex : Accueil, À propos)
};

export type ChampAdmin = {
  nom: string;
  libelle: string;
  type: TypeChamp;
  requis?: boolean;
  aide?: string;
  options?: Libelles;          // types « liste » et « listeMultiple » : options fixes…
  source?: SourceOptions;      // … ou lues dans l'API
  entier?: boolean;            // valeur(s) envoyée(s) comme nombre(s) : identifiants
  defaut?: string | boolean;   // valeur proposée à la création
  nullable?: boolean;          // laissé vide → effacé (null)
  creationSeulement?: boolean; // non modifiable ensuite
  longueurMax?: number;        // types « texte » et « texteLong »
};

export type FormatColonne = 'texte' | 'date' | 'dateHeure' | 'prix' | 'booleen' | 'image' | 'statut';

export type ColonneAdmin = {
  libelle: string;
  chemin: string;              // ex : « session.experience.titre »
  format?: FormatColonne;
  libelles?: Libelles;         // valeur en base → texte affiché…
  source?: SourceOptions;      // … ou libellés lus dans l'API
  complements?: string[];      // autres valeurs affichées en petit dessous (ex : e-mail, téléphone)
};

/** Action sur une ligne (Masquer, Fermer la session, Annuler…), proposée seulement si la condition `si` est remplie. */
export type ActionLigne = {
  id: string;                  // peut être proposée par l'API à la place d'une suppression refusée (suggestion)
  libelle: string;
  si: { chemin: string; valeurs: unknown[] };
  methode: 'PUT' | 'PATCH';
  corps: Record<string, unknown> | ((ligne: Ligne) => Record<string, unknown>);
  confirmation?: (ligne: Ligne) => string;
  message: string;             // affiché après l'action
};

export type RessourceAdmin = {
  cle: string;                 // /admin/<cle>
  titre: string;
  singulier: string;           // « une expérience »
  textes: { enregistre: string; supprime: string };     // messages après l'action, ex : « Expérience enregistrée »
  designation: (ligne: Ligne) => string;                 // dans les confirmations : « l’atelier « Pain perdu » »
  description: string;
  api: string;
  colonnes: ColonneAdmin[];
  champs?: ChampAdmin[] | ((ligne: Ligne | null) => ChampAdmin[]); // présents → création et modification ; fonction : champs propres à chaque ligne
  creation?: boolean;          // false : modification seulement
  modification?: boolean;      // false : création seulement (pas de bouton « Modifier »)
  methodeModification?: 'PUT' | 'PATCH';
  suppression?: boolean;
  statut?: { champ: string; options: Libelles };        // statut modifiable dans la liste
  filtre?: { parametre: string; options?: Libelles; source?: SourceOptions }; // filtre de la liste (?statut=…)
  fiche?: ColonneAdmin[];      // fiche détaillée (lecture seule) ouverte par « Voir » ou en tête du formulaire
  actions?: ActionLigne[];
  actionGlobale?: { libelle: string; api: string };     // bouton de rubrique (ex : import Ausha), POST sur `api`
};

/** Champs du formulaire, pour une ligne (null : création). */
export const champsDe = (ressource: RessourceAdmin, ligne: Ligne | null) =>
  typeof ressource.champs === 'function' ? ressource.champs(ligne) : ressource.champs ?? [];

const nommer = (article: string, chemin: string) => (ligne: Ligne) => `${article} « ${String(lire(ligne, chemin) ?? '')} »`;

/** Paire Masquer / Afficher sur un champ booléen (actif, visible, publie). */
function visibilite(champ: string, textes: { masquer: string; afficher: string; masque: string; affiche: string }): ActionLigne[] {
  return [
    { id: 'masquer', libelle: textes.masquer, si: { chemin: champ, valeurs: [true] }, methode: 'PUT', corps: { [champ]: false }, message: textes.masque },
    { id: 'afficher', libelle: textes.afficher, si: { chemin: champ, valeurs: [false] }, methode: 'PUT', corps: { [champ]: true }, message: textes.affiche },
  ];
}

const ARTICLES_EXPERIENCE: Libelles = { atelier: 'l’atelier', good_tour: 'le good tour', immersion: 'l’immersion' };

const SOURCE_EXPERIENCES: SourceOptions = { api: '/api/experiences', valeur: e => String(e.id), libelle: e => String(e.titre) };
const SOURCE_CATEGORIES: SourceOptions = { api: '/api/blog/categories', valeur: c => String(c.valeur), libelle: c => String(c.libelle) };
/** Épisodes du plus récent au plus ancien, avec leur date. */
const SOURCE_EPISODES: SourceOptions = { api: '/api/episodes', valeur: e => String(e.id), libelle: e => `${formatDate(String(e.datePublication))} · ${String(e.titre)}` };

/** Pages qui affichent une galerie photos : accueil, à propos et la page de chaque expérience. */
const PAGES_AVEC_GALERIE: SourceOptions = {
  api: '/api/experiences', valeur: e => `/experiences/${String(e.slug)}`, libelle: e => `Expérience : ${String(e.titre)}`,
  fixes: { '/': 'Accueil', '/a-propos': 'À propos' },
};

// Pages dont les textes sont modifiables (emplacements : src/backend/contenus/textes-par-defaut.ts).
const PAGES_TEXTES: Libelles = {
  accueil: 'Accueil', 'a-propos': 'À propos', studio: 'Studio', experiences: 'Expériences', blog: 'Blog',
  confidentialite: 'Confidentialité', 'mentions-legales': 'Mentions légales',
};
const designationTexte = (ligne: Ligne) => `« ${String(lire(ligne, 'libelle'))} » (${libelle(PAGES_TEXTES, String(lire(ligne, 'page')))})`;

const visible = (aide: string, defaut: boolean): ChampAdmin => ({ nom: 'visible', libelle: 'Visible sur le site', type: 'booleen', aide, defaut });
const masquerAfficher = visibilite('visible', { masquer: 'Masquer', afficher: 'Afficher', masque: 'Masqué : n’apparaît plus sur le site.', affiche: 'De nouveau visible sur le site.' });

export const RESSOURCES_ADMIN: RessourceAdmin[] = [
  {
    cle: 'reservations', titre: 'Réservations', singulier: 'une réservation', api: '/api/reservations',
    textes: { enregistre: 'Réservation enregistrée', supprime: 'Réservation supprimée' },
    designation: ligne => `la réservation n° ${ligne.id} (${String(lire(ligne, 'nom'))})`,
    description: 'Les réservations payées en ligne. Elles ne se suppriment jamais (historique et comptabilité) : on les annule. Une réservation payée doit d’abord être remboursée dans Stripe.',
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
    fiche: [
      { libelle: 'Réservation', chemin: 'id' },
      { libelle: 'Statut', chemin: 'statut', format: 'statut', libelles: STATUTS_RESERVATION },
      { libelle: 'Expérience', chemin: 'session.experience.titre' },
      { libelle: 'Date', chemin: 'session.dateDebut', format: 'dateHeure' },
      { libelle: 'Client', chemin: 'nom' },
      { libelle: 'E-mail', chemin: 'email' },
      { libelle: 'Téléphone', chemin: 'telephone' },
      { libelle: 'Personnes', chemin: 'nbPersonnes' },
      { libelle: 'Montant', chemin: 'montantCents', format: 'prix' },
      { libelle: 'Réservée le', chemin: 'createdAt', format: 'dateHeure' },
      { libelle: 'Confidentialité acceptée le', chemin: 'consentementLe', format: 'dateHeure' },
      { libelle: 'Paiement Stripe', chemin: 'stripeSessionId' },
    ],
    actions: [{
      id: 'annuler', libelle: 'Annuler', si: { chemin: 'statut', valeurs: ['en_attente', 'payee'] }, methode: 'PATCH', corps: { statut: 'annulee' },
      confirmation: ligne => `Annuler la réservation n° ${ligne.id} (${String(lire(ligne, 'nom'))}) ? Les places seront libérées. Si elle est payée, remboursez-la d’abord dans Stripe.`,
      message: 'Réservation annulée : les places sont libérées.',
    }],
  },
  {
    cle: 'devis', titre: 'Demandes de devis', singulier: 'une demande', api: '/api/devis',
    textes: { enregistre: 'Demande de devis enregistrée', supprime: 'Demande de devis supprimée' },
    designation: ligne => `la demande de devis de ${String(lire(ligne, 'entreprise'))}`,
    description: 'Les demandes des entreprises et des groupes. Passez-les « en cours » quand vous les traitez ; la note interne n’est visible que par vous.',
    colonnes: [
      { libelle: 'Reçue le', chemin: 'createdAt', format: 'date' },
      { libelle: 'Entreprise', chemin: 'entreprise' },
      { libelle: 'Contact', chemin: 'contactNom', complements: ['email', 'telephone'] },
      { libelle: 'Demande', chemin: 'typeDemande', libelles: TYPES_DEVIS, complements: ['experience.titre'] },
      { libelle: 'Participants', chemin: 'nbParticipants' },
      { libelle: 'Date souhaitée', chemin: 'dateSouhaitee', format: 'date' },
      { libelle: 'Lieu', chemin: 'lieuSouhaite', libelles: LIEUX_DEVIS },
      { libelle: 'Message', chemin: 'message' },
      { libelle: 'Note interne', chemin: 'noteInterne' },
    ],
    statut: { champ: 'statut', options: STATUTS_DEVIS },
    filtre: { parametre: 'statut', options: STATUTS_DEVIS },
    fiche: [
      { libelle: 'Reçue le', chemin: 'createdAt', format: 'dateHeure' },
      { libelle: 'Entreprise', chemin: 'entreprise' },
      { libelle: 'Contact', chemin: 'contactNom', complements: ['email', 'telephone'] },
      { libelle: 'Demande', chemin: 'typeDemande', libelles: TYPES_DEVIS, complements: ['experience.titre'] },
      { libelle: 'Participants', chemin: 'nbParticipants' },
      { libelle: 'Date souhaitée', chemin: 'dateSouhaitee', format: 'date' },
      { libelle: 'Lieu', chemin: 'lieuSouhaite', libelles: LIEUX_DEVIS },
      { libelle: 'Message', chemin: 'message' },
      { libelle: 'Confidentialité acceptée le', chemin: 'consentementLe', format: 'dateHeure' },
    ],
    champs: [
      { nom: 'statut', libelle: 'Statut', type: 'liste', options: STATUTS_DEVIS, requis: true },
      { nom: 'noteInterne', libelle: 'Note interne', type: 'texteLong', nullable: true, aide: 'Visible seulement dans l’administration, jamais par le client.' },
    ],
    creation: false, methodeModification: 'PATCH', suppression: true,
  },
  {
    cle: 'experiences', titre: 'Expériences', singulier: 'une expérience', api: '/api/experiences',
    textes: { enregistre: 'Expérience enregistrée', supprime: 'Expérience supprimée' },
    designation: ligne => `${libelle(ARTICLES_EXPERIENCE, String(ligne.type))} « ${String(ligne.titre)} »`,
    description: 'Ateliers, good tours et immersions. Une expérience qui a déjà des sessions ne se supprime pas : masquez-la, elle n’apparaîtra plus sur le site.',
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
    actions: visibilite('actif', { masquer: 'Masquer', afficher: 'Afficher', masque: 'Expérience masquée : elle n’apparaît plus sur le site.', affiche: 'Expérience de nouveau visible sur le site.' }),
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'sessions', titre: 'Sessions', singulier: 'une session', api: '/api/sessions',
    textes: { enregistre: 'Session enregistrée', supprime: 'Session supprimée' },
    designation: ligne => `la session du ${formatDateHeure(String(lire(ligne, 'dateDebut')))} (${String(lire(ligne, 'experience.titre'))})`,
    description: 'Les dates de chaque expérience. « Fermer » arrête les réservations ; une session qui a des réservations ne se supprime pas.',
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
      { nom: 'experienceId', libelle: 'Expérience', type: 'liste', source: SOURCE_EXPERIENCES, entier: true, requis: true, creationSeulement: true },
      { nom: 'dateDebut', libelle: 'Début', type: 'dateHeure', requis: true },
      { nom: 'dateFin', libelle: 'Fin', type: 'dateHeure', requis: true },
      { nom: 'lieu', libelle: 'Lieu', type: 'texte', requis: true },
      { nom: 'placesTotal', libelle: 'Nombre de places', type: 'nombre', requis: true },
      { nom: 'prixCents', libelle: 'Prix par personne (€)', type: 'prix', nullable: true, aide: 'Vide : prix de l’expérience.' },
      { nom: 'statut', libelle: 'Statut', type: 'liste', options: STATUTS_SESSION, defaut: 'ouverte' },
    ],
    actions: [
      {
        id: 'fermer', libelle: 'Fermer la session', si: { chemin: 'statut', valeurs: ['ouverte'] }, methode: 'PUT', corps: { statut: 'complete' },
        confirmation: ligne => `Fermer la session du ${formatDateHeure(String(lire(ligne, 'dateDebut')))} ? Plus personne ne pourra réserver ; les réservations déjà faites sont gardées.`,
        message: 'Session fermée : plus personne ne peut réserver.',
      },
      { id: 'rouvrir', libelle: 'Rouvrir', si: { chemin: 'statut', valeurs: ['complete'] }, methode: 'PUT', corps: { statut: 'ouverte' }, message: 'Session rouverte aux réservations.' },
    ],
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'textes', titre: 'Textes des pages', singulier: 'un texte', api: '/api/textes',
    textes: { enregistre: 'Texte enregistré : il est déjà en ligne.', supprime: 'Texte supprimé' },
    designation: designationTexte,
    description: 'Les titres, paragraphes et boutons de l’accueil, des pages « À propos », studio et expériences, du blog, et le texte des pages Confidentialité et Mentions légales. Un texte modifié change aussitôt sur le site ; « Remettre le texte d’origine » annule vos changements.',
    colonnes: [
      { libelle: 'Page', chemin: 'page', libelles: PAGES_TEXTES },
      { libelle: 'Emplacement', chemin: 'libelle' },
      { libelle: 'Texte', chemin: 'apercu' },
      { libelle: 'Modifié', chemin: 'modifie', format: 'booleen' },
    ],
    filtre: { parametre: 'page', options: PAGES_TEXTES },
    // Un seul champ, adapté à l'emplacement : paragraphe ou ligne, obligatoire ou non, longueur maximale.
    champs: ligne => {
      const longueurMax = Number(lire(ligne, 'longueurMax')) || undefined;
      const facultatif = lire(ligne, 'facultatif') === true;
      const format = lire(ligne, 'format');
      const aide = [
        facultatif && 'Laissé vide, rien n’est affiché.',
        longueurMax && `${longueurMax} caractères maximum.`,
        // Le texte d'une page entière ne tient pas dans l'aide : « Remettre le texte d'origine » reste possible.
        format !== 'long' && `Texte d’origine : « ${String(lire(ligne, 'texteOrigine') ?? '')} »`,
      ];
      return [{
        nom: 'texte', libelle: String(lire(ligne, 'libelle') ?? 'Texte'), type: format === 'paragraphe' || format === 'long' ? 'texteLong' : 'texte',
        requis: !facultatif, longueurMax, aide: aide.filter(Boolean).join(' '),
      }];
    },
    actions: [{
      id: 'origine', libelle: 'Remettre le texte d’origine', si: { chemin: 'modifie', valeurs: [true] }, methode: 'PUT',
      corps: ligne => ({ texte: lire(ligne, 'texteOrigine') }),
      confirmation: ligne => `Remettre le texte d’origine pour ${designationTexte(ligne)} ? Le texte actuel sera remplacé par : « ${String(lire(ligne, 'texteOrigine'))} »`,
      message: 'Texte d’origine remis en ligne.',
    }],
    creation: false, methodeModification: 'PUT', suppression: false,
  },
  {
    cle: 'photos', titre: 'Photos', singulier: 'une photo', api: '/api/images',
    textes: { enregistre: 'Photo enregistrée', supprime: 'Photo supprimée (le fichier aussi)' },
    designation: nommer('la photo', 'alt'),
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
      { nom: 'page', libelle: 'Page qui affiche la photo', type: 'liste', source: PAGES_AVEC_GALERIE, requis: true },
      { nom: 'ordre', libelle: 'Ordre dans la galerie', type: 'nombre', defaut: '0' },
    ],
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'episodes', titre: 'Épisodes du podcast', singulier: 'un épisode', api: '/api/episodes',
    textes: { enregistre: 'Épisode enregistré', supprime: 'Épisode supprimé' },
    designation: nommer('l’épisode', 'titre'),
    description: 'Les épisodes du podcast La recette. « Importer depuis Ausha » ajoute les nouveaux épisodes sans écraser le résumé, le type, l’invité ni les liens saisis ici. Un épisode supprimé revient au prochain import : pour le retirer de la page « Épisodes complets », changez plutôt son type.',
    colonnes: [
      { libelle: 'Saison', chemin: 'saison' },
      { libelle: 'N°', chemin: 'numero' },
      { libelle: 'Titre', chemin: 'titre' },
      { libelle: 'Type', chemin: 'type', libelles: TYPES_EPISODE },
      { libelle: 'Publié le', chemin: 'datePublication', format: 'date' },
      { libelle: 'Invité', chemin: 'invite' },
    ],
    filtre: { parametre: 'type', options: TYPES_EPISODE },
    actionGlobale: { libelle: 'Importer depuis Ausha', api: '/api/episodes/import' },
    champs: [
      { nom: 'type', libelle: 'Type', type: 'liste', options: TYPES_EPISODE, requis: true, defaut: 'complet', aide: 'Les épisodes complets sont affichés par défaut sur la page podcast.' },
      { nom: 'saison', libelle: 'Saison', type: 'nombre', requis: true, defaut: '1' },
      { nom: 'numero', libelle: 'Numéro', type: 'nombre', requis: true },
      { nom: 'titre', libelle: 'Titre', type: 'texte', requis: true },
      { nom: 'invite', libelle: 'Invité', type: 'texte', nullable: true },
      { nom: 'datePublication', libelle: 'Date de publication', type: 'date', requis: true },
      { nom: 'dureeMin', libelle: 'Durée (minutes)', type: 'nombre', requis: true },
      { nom: 'resume', libelle: 'Résumé affiché sur le site', type: 'texteLong', aide: 'Rempli à l’import avec la description, sans les crédits ni les liens de fin.' },
      { nom: 'description', libelle: 'Description complète', type: 'texteLong', requis: true },
      { nom: 'image', libelle: 'Visuel (lien)', type: 'texte', requis: true, aide: 'Lien du visuel Ausha, ou /images/… pour une photo envoyée.' },
      { nom: 'embedUrl', libelle: 'Lien du lecteur Ausha', type: 'texte', requis: true },
      { nom: 'audioUrl', libelle: 'Lien du fichier audio (MP3)', type: 'texte', nullable: true, aide: 'Rempli à l’import depuis Ausha. Vide : le lecteur Ausha remplace le lecteur du site.' },
      { nom: 'spotifyUrl', libelle: 'Lien Spotify', type: 'texte', nullable: true },
      { nom: 'deezerUrl', libelle: 'Lien Deezer', type: 'texte', nullable: true },
      { nom: 'appleUrl', libelle: 'Lien Apple Podcasts', type: 'texte', nullable: true },
      { nom: 'youtubeUrl', libelle: 'Lien YouTube', type: 'texte', nullable: true },
    ],
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'articles', titre: 'Articles du blog', singulier: 'un article', api: '/api/articles',
    textes: { enregistre: 'Article enregistré', supprime: 'Article supprimé' },
    designation: nommer('l’article', 'titre'),
    description: 'Les articles du blog, classés par catégorie. Un article non publié reste un brouillon invisible sur le site. Liez-le à un épisode et à des expériences : ils s’affichent sous l’article, avec les prochaines dates.',
    colonnes: [
      { libelle: 'Titre', chemin: 'titre' },
      { libelle: 'Catégorie', chemin: 'categorie', source: SOURCE_CATEGORIES },
      { libelle: 'Épisode lié', chemin: 'episode.titre' },
      { libelle: 'Date', chemin: 'datePublication', format: 'date' },
      { libelle: 'Publié', chemin: 'publie', format: 'booleen' },
    ],
    filtre: { parametre: 'categorie', source: SOURCE_CATEGORIES },
    champs: [
      { nom: 'titre', libelle: 'Titre', type: 'texte', requis: true },
      { nom: 'slug', libelle: 'Adresse de la page', type: 'texte', requis: true, aide: 'Devient /blog/<adresse>. Minuscules, chiffres et tirets.' },
      { nom: 'categorie', libelle: 'Catégorie', type: 'liste', source: SOURCE_CATEGORIES, requis: true },
      { nom: 'extrait', libelle: 'Extrait', type: 'texte', requis: true, aide: 'Résumé affiché dans la liste et par Google : une ou deux phrases (160 caractères environ).' },
      { nom: 'contenu', libelle: 'Contenu', type: 'texteLong', requis: true, aide: 'Mise en forme Markdown : **gras**, ## Titre, - liste.' },
      { nom: 'image', libelle: 'Photo de couverture', type: 'image', aide: 'Aussi montrée quand l’article est partagé sur les réseaux sociaux.' },
      { nom: 'imageAlt', libelle: 'Description de la photo', type: 'texte' },
      { nom: 'episodeId', libelle: 'Épisode du podcast lié', type: 'liste', source: SOURCE_EPISODES, entier: true, nullable: true, aide: 'Facultatif : ajoute « Écouter l’épisode » sous l’article. Du plus récent au plus ancien.' },
      { nom: 'experienceIds', libelle: 'Expériences liées', type: 'listeMultiple', source: SOURCE_EXPERIENCES, entier: true, aide: 'Facultatif : leurs prochaines dates s’affichent sous l’article. Sans expérience cochée, un lien vers toutes les expériences est proposé.' },
      { nom: 'datePublication', libelle: 'Date de publication', type: 'date' },
      { nom: 'publie', libelle: 'Publié', type: 'booleen', defaut: false },
    ],
    actions: visibilite('publie', { masquer: 'Dépublier', afficher: 'Publier', masque: 'Article dépublié : il redevient un brouillon.', affiche: 'Article publié sur le blog.' }),
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'avis', titre: 'Avis clients', singulier: 'un avis', api: '/api/avis',
    textes: { enregistre: 'Avis enregistré', supprime: 'Avis supprimé' },
    designation: ligne => `l’avis de ${String(ligne.nom)}`,
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
    actions: masquerAfficher,
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'partenaires', titre: 'Partenaires', singulier: 'un partenaire', api: '/api/partenaires',
    textes: { enregistre: 'Partenaire enregistré', supprime: 'Partenaire supprimé' },
    designation: nommer('le partenaire', 'nom'),
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
    actions: masquerAfficher,
    methodeModification: 'PUT', suppression: true,
  },
  {
    cle: 'utilisateurs', titre: 'Administrateurs', singulier: 'un administrateur', api: '/api/utilisateurs',
    textes: { enregistre: 'Administrateur ajouté : il reçoit par e-mail un lien, valable 1 h, pour choisir son mot de passe.', supprime: 'Accès supprimé' },
    designation: ligne => `l’accès de ${String(ligne.nom)} (${String(ligne.email)})`,
    description: 'Les personnes qui se connectent à cet espace. Un admin ajouté reçoit par e-mail un lien valable 1 h pour choisir son mot de passe ; ensuite, « Mot de passe oublié » sur la page de connexion. Le dernier admin ne peut pas être supprimé.',
    colonnes: [
      { libelle: 'Nom', chemin: 'nom', complements: ['email'] },
      { libelle: 'Mot de passe choisi', chemin: 'motDePasseChoisi', format: 'booleen' },
      { libelle: 'Ajouté le', chemin: 'createdAt', format: 'date' },
    ],
    champs: [
      { nom: 'nom', libelle: 'Nom', type: 'texte', requis: true, longueurMax: 120 },
      { nom: 'email', libelle: 'E-mail', type: 'texte', requis: true, aide: 'Le lien pour choisir le mot de passe y est envoyé.' },
    ],
    modification: false, suppression: true,
  },
  {
    cle: 'newsletter', titre: 'Newsletter', singulier: 'une adresse', api: '/api/newsletter',
    textes: { enregistre: 'Adresse enregistrée', supprime: 'Adresse désinscrite' },
    designation: ligne => `l’adresse ${String(ligne.email)} de la newsletter`,
    description: 'Les adresses inscrites depuis l’accueil du site (case de confidentialité cochée). Ajoutez-en une à la main, ou supprimez celle d’une personne qui demande à être désinscrite.',
    colonnes: [
      { libelle: 'E-mail', chemin: 'email' },
      { libelle: 'Inscrite le', chemin: 'createdAt', format: 'date' },
      { libelle: 'Confidentialité acceptée le', chemin: 'consentementLe', format: 'date' },
    ],
    champs: [{ nom: 'email', libelle: 'Adresse e-mail', type: 'texte', requis: true }],
    methodeModification: 'PUT', suppression: true,
  },
];

export const ressourceAdmin = (cle: string) => RESSOURCES_ADMIN.find(r => r.cle === cle);
