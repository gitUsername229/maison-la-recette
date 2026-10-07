# Base de données

## Vue d'ensemble

| Table | Rôle |
|---|---|
| `Experience` | Les offres : atelier, good tour, immersion |
| `Session` | Une date précise d'une expérience (lieu, places, prix) |
| `Reservation` | Une réservation B2C payée en ligne sur une session |
| `DemandeDevis` | Une demande de devis (expérience, sponsoring, studio, événement) |
| `Episode` | Un épisode du podcast La recette, importé depuis le flux RSS Ausha |
| `Article` | Un article du blog |
| `Avis` | Un avis client (témoignage) |
| `Partenaire` | Un producteur ou artisan partenaire |
| `Image` | Une photo de galerie, rattachée à une page du site |
| `Newsletter` | Un e-mail inscrit à la newsletter |
| `TextePage` | Un texte fixe de l'accueil, d'À propos, du studio ou du blog (titre, paragraphe, bouton), modifiable par Julie |
| `User` | Un compte (client ou admin) |
| `AuthSession`, `AuthAccount`, `AuthVerification` | Tables techniques de Better Auth : sessions de connexion, mot de passe haché, jetons |

Relations :

```
Experience 1 ──── n Session 1 ──── n Reservation
Experience 1 ──── n DemandeDevis   (optionnel)
Article    n ──── n Experience     (expériences liées à un article)
Episode    1 ──── n Article        (episodeId, optionnel)
User       1 ──── n Reservation    (userId, vide pour les réservations faites avant les comptes)
User       1 ──── n DemandeDevis   (userId, idem)
User       1 ──── n AuthSession / AuthAccount  (supprimés avec le compte)
Image  ──── une page du site, par son chemin (ex : /a-propos), sans clé étrangère
```

## `Experience`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `slug` | String | Unique, ex : `atelier-cuisine-anti-gaspi` |
| `type` | String | `atelier`, `good_tour` ou `immersion` |
| `titre` | String | |
| `accroche` | String | Phrase courte pour les cartes |
| `description` | String | Texte complet |
| `dureeMin` | Int | Durée en minutes |
| `prixCents` | Int? | Prix par personne (B2C), en centimes : dès `6000` pour un good tour, dès `7000` pour un atelier. Vide si l'expérience est sur devis uniquement |
| `prixEntrepriseCents` | Int? | Prix par personne (B2B), optionnel |
| `reservableEnLigne` | Boolean | `true` : sessions réservables et payées en ligne (Stripe). `false` : sur devis uniquement, pas de paiement en ligne (cas des immersions, surtout B2B) |
| `capaciteMax` | Int | Nombre maximum de participants |
| `lieu` | String? | Lieu habituel |
| `image` | String | **Image de couverture**, ex : `/images/ateliers/cover.jpg` |
| `imageAlt` | String | Texte alternatif de la couverture |
| `actif` | Boolean | Visible sur le site ou non |
| `createdAt` | DateTime | |

## `Session`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `experienceId` | Int | Clé étrangère vers `Experience` |
| `dateDebut` | DateTime | |
| `dateFin` | DateTime | |
| `lieu` | String | Lieu précis de cette session |
| `placesTotal` | Int | |
| `placesPrises` | Int | Mis à jour par le webhook |
| `prixCents` | Int? | Remplace le prix de l'expérience si renseigné |
| `statut` | String | `ouverte`, `complete` ou `annulee` |

## `Reservation`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `sessionId` | Int | Clé étrangère vers `Session` |
| `userId` | String? | Clé étrangère vers `User`, renseignée par le serveur depuis la session (jamais par le front). Mise à vide si le compte est supprimé |
| `nom` | String | Copié du compte au moment de la réservation |
| `email` | String | Copié du compte au moment de la réservation |
| `telephone` | String? | Copié du compte au moment de la réservation |
| `nbPersonnes` | Int | |
| `montantCents` | Int | Total payé |
| `statut` | String | `en_attente`, `payee` ou `annulee` |
| `stripeSessionId` | String? | Unique, ex : `cs_test_...` |
| `checkoutKey` | String? | UUID unique de la demande ; évite les doubles réservations |
| `checkoutPayload` | String? | Paramètres Stripe figés pour rejouer une création après timeout, jamais exposés par l'API |
| `createdAt` | DateTime | |

## `DemandeDevis`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `userId` | String? | Clé étrangère vers `User`, renseignée par le serveur depuis la session. Mise à vide si le compte est supprimé |
| `entreprise` | String | |
| `contactNom` | String | Nom du compte |
| `email` | String | E-mail du compte |
| `telephone` | String? | Téléphone du compte (ou saisi dans le formulaire si le compte n'en a pas) : Julie rappelle avant de répondre |
| `typeDemande` | String | `experience`, `sponsoring`, `studio` ou `evenement` |
| `experienceId` | Int? | Clé étrangère vers `Experience`, optionnelle |
| `nbParticipants` | Int? | |
| `dateSouhaitee` | DateTime? | |
| `lieuSouhaite` | String? | `dans_les_locaux` (chez l'entreprise) ou `a_proximite` (lieu proche de l'entreprise) |
| `message` | String | |
| `statut` | String | `nouvelle`, `en_cours` ou `traitee` |
| `noteInterne` | String? | Note de Julie (ex : « Rappeler jeudi »), modifiable dans `/admin/devis`. Jamais montrée au client |
| `createdAt` | DateTime | |

## `Episode`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `guid` | String? | Unique, identifiant de l'épisode dans le flux RSS (évite les doublons à l'import). Vide pour un épisode saisi à la main |
| `saison` | Int | Numéro de la saison (`1` par défaut) |
| `numero` | Int | Numéro de l'épisode (`0` quand le flux n'en donne pas) |
| `titre` | String | |
| `description` | String | Description complète, importée du flux RSS |
| `resume` | String | Texte affiché sur le site. Pré-rempli à l'import avec la description arrêtée avant le texte commun de fin (crédits, soutien, réseaux), modifiable dans l'admin |
| `type` | String | `complet` (par défaut), `extrait` ou `replay`. Déduit du titre à l'import (`REPLAY`/`REDIFFUSION`, `EXTRAIT`/`TEASER`), modifiable dans l'admin |
| `invite` | String? | Chef ou producteur invité |
| `datePublication` | DateTime | |
| `dureeMin` | Int | |
| `image` | String | Visuel de l'épisode (URL fournie par le flux Ausha) |
| `embedUrl` | String | Lien du lecteur Ausha (`player.ausha.co/?podcastId=…`, déduit du fichier audio du flux) |
| `audioUrl` | String? | Fichier audio du flux (`audio.ausha.co/….mp3`), lu par le lecteur sur mesure de `/podcast`. Vide : lecteur Ausha |
| `spotifyUrl` | String? | |
| `deezerUrl` | String? | |
| `appleUrl` | String? | |
| `youtubeUrl` | String? | |

L'import (`POST /api/episodes/import`) crée ou met à jour les épisodes par `guid`. Il n'écrase pas les champs saisis dans l'admin (`resume`, `type`, `invite`, liens des plateformes).
Les règles de type et de coupure du résumé sont dans `src/backend/podcast/emission.ts`.

## `Article`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `slug` | String | Unique, ex : `cuisiner-les-epluchures` |
| `titre` | String | Aussi utilisé comme `<title>` de la page |
| `extrait` | String | Résumé court pour la liste et la meta description |
| `contenu` | String | Texte complet (Markdown) |
| `image` | String | Image de couverture, ex : `/images/blog/epluchures.jpg` |
| `imageAlt` | String | Texte alternatif de la couverture |
| `categorie` | String | `retours-experience`, `coulisses-podcast`, `guides` (par défaut) ou `entreprises`. Libellés et descriptions : `src/backend/contenus/categories-blog.ts` |
| `episodeId` | Int? | Épisode du podcast lié (bloc « Écouter l'épisode »). Mis à vide si l'épisode est supprimé |
| `experiences` | relation | Expériences liées (bloc « Envie d'aller plus loin ? » avec leurs prochaines dates), table `_ArticleToExperience` |
| `datePublication` | DateTime | |
| `publie` | Boolean | `false` : brouillon, invisible sur le site |

## `Avis`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `nom` | String | Qui parle, ex : `Claire D.` |
| `citation` | String | Le témoignage |
| `contexte` | String | Ex : `Team building, atelier anti-gaspi` |
| `note` | Int? | Note sur 5, optionnelle |
| `visible` | Boolean | Affiché sur le site ou non |

Pas de logos clients : seuls les avis (texte) sont affichés.

## `Partenaire`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `nom` | String | |
| `metier` | String | Ex : `Maraîchère`, `Chef`, `Brasseur` |
| `photo` | String | Ex : `/images/partenaires/maraichere.jpg` |
| `photoAlt` | String | Texte alternatif de la photo |
| `description` | String | |
| `visible` | Boolean | `false` par défaut : affiché seulement après l'accord du partenaire |

## `Image`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `url` | String | Ex : `/images/ateliers/photo-2.jpg` |
| `alt` | String | Texte alternatif (obligatoire) |
| `page` | String | Chemin de la page qui affiche la galerie, ex : `/`, `/a-propos`, `/experiences/atelier-cuisine-anti-gaspi` (galerie de l'expérience) |
| `ordre` | Int | Position dans la galerie |

Les fichiers envoyés depuis l'admin sont dans `public/images/uploads/` (ignoré par git) : un fichier est effacé
du disque quand plus aucune ligne n'y fait référence (`Image.url`, `Experience.image`, `Article.image`, `Partenaire.photo`).

## `Newsletter`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `email` | String | Unique, enregistré en minuscules. Inscription depuis l'accueil, gestion dans `/admin/newsletter` |
| `createdAt` | DateTime | Date d'inscription |

## `TextePage`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `page` | String | `accueil`, `a-propos`, `studio`, `experiences` ou `blog` |
| `cle` | String | Emplacement dans la page, ex : `titre`, `introduction`, `bouton`. Unique avec `page` |
| `texte` | String | Texte affiché, modifiable dans `/admin/textes` |
| `updatedAt` | DateTime | Dernière modification |

Les emplacements, leur libellé, leur forme (titre, paragraphe, bouton) et leur texte d'origine sont définis dans
`src/backend/contenus/textes-par-defaut.ts`. Le seed crée les textes absents sans jamais remplacer un texte modifié ;
une page affiche le texte d'origine d'un emplacement qui n'est pas encore en base.

## `User`

Un compte, créé par l'inscription (`/inscription`) ou par le seed pour l'admin.

| Colonne | Type | Détail |
|---|---|---|
| `id` | String | Clé primaire (générée par Better Auth) |
| `nom` | String | Champ `name` de Better Auth, stocké dans la colonne `nom` |
| `email` | String | Unique, en minuscules |
| `emailVerified` | Boolean | `true` après un clic sur le lien envoyé à l'inscription (non bloquant pour réserver) |
| `image` | String? | Champ de Better Auth, non utilisé |
| `telephone` | String? | Optionnel |
| `role` | String | `client` (par défaut) ou `admin`. Impossible à choisir à l'inscription : seul un admin peut le changer |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

Le **mot de passe** n'est pas dans `User` : Better Auth le range, haché en **argon2id**, dans `AuthAccount`
(`providerId = "credential"`, `accountId` = id du compte). Le seed crée le compte admin à partir de
`ADMIN_EMAIL` et `ADMIN_PASSWORD` (`.env.local`) et ne remplace jamais le mot de passe d'un compte existant.

Le dernier compte `admin` ne peut être ni supprimé ni rétrogradé.

## Tables techniques de Better Auth

| Table | Rôle |
|---|---|
| `AuthSession` | Une connexion active : `token` (dans le cookie httpOnly), `expiresAt`, `ipAddress`, `userAgent`, `userId` |
| `AuthAccount` | Une méthode de connexion d'un compte : `providerId` (`credential`), `password` (haché), jetons OAuth inutilisés |
| `AuthVerification` | Jetons temporaires : réinitialisation du mot de passe (1 h, usage unique) |

Elles s'appellent `Auth…` pour ne pas entrer en conflit avec `Session` (les dates des expériences).
Ne pas les modifier à la main : elles suivent le format imposé par Better Auth.
