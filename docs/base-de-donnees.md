# Base de données

## Vue d'ensemble

| Table | Rôle |
|---|---|
| `Experience` | Les offres : atelier, food tour (`good_tour`), immersion |
| `Session` | Une date précise d'une expérience (lieu, places, prix) |
| `Reservation` | Une réservation B2C payée en ligne sur une session |
| `DemandeDevis` | Une demande de devis (expérience, sponsoring, studio, événement) |
| `Episode` | Un épisode du podcast La recette, importé depuis le flux RSS Ausha |
| `Article` | Un article du blog |
| `Avis` | Un avis client (témoignage) |
| `Partenaire` | Un producteur ou artisan partenaire |
| `Image` | Une photo de galerie, rattachée à une page du site |
| `Newsletter` | Un e-mail inscrit à la newsletter |
| `TextePage` | Un texte fixe de l'accueil, d'À propos, du studio, des expériences, du blog ou des pages légales (titre, paragraphe, bouton, texte de page), modifiable par Julie |
| `User` | Un compte d'administration (les visiteurs n'ont pas de compte) |
| `AuthSession`, `AuthAccount`, `AuthVerification` | Tables techniques de Better Auth : sessions de connexion, mot de passe haché, jetons |

Relations :

```
Experience 1 ──── n Session 1 ──── n Reservation
Experience 1 ──── n DemandeDevis   (optionnel)
Article    n ──── n Experience     (expériences liées à un article)
Episode    1 ──── n Article        (episodeId, optionnel)
User       1 ──── n AuthSession / AuthAccount  (supprimés avec le compte)
Image  ──── une page du site, par son chemin (ex : /a-propos), sans clé étrangère
```

Les réservations et les demandes de devis ne sont liées à aucun compte : le nom, l'e-mail et le téléphone saisis
dans le formulaire sont enregistrés avec elles.

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
| `prixCents` | Int? | Prix par personne (B2C), en centimes : dès `6000` pour un food tour, dès `7000` pour un atelier. Vide si l'expérience est sur devis uniquement |
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
| `nom` | String | Saisi dans le formulaire de réservation |
| `email` | String | Saisi dans le formulaire (en minuscules) ; reçoit la confirmation |
| `telephone` | String? | Saisi dans le formulaire, facultatif |
| `nbPersonnes` | Int | |
| `montantCents` | Int | Total payé |
| `statut` | String | `en_attente`, `payee` ou `annulee` |
| `stripeSessionId` | String? | Unique, ex : `cs_test_...` |
| `checkoutKey` | String? | UUID unique de la demande ; évite les doubles réservations |
| `checkoutPayload` | String? | Paramètres Stripe figés pour rejouer une création après timeout, jamais exposés par l'API |
| `consentementLe` | DateTime? | Date à laquelle la case « politique de confidentialité » a été cochée (vide pour les réservations plus anciennes) |
| `createdAt` | DateTime | |

## `DemandeDevis`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `entreprise` | String | Saisie dans le formulaire |
| `contactNom` | String | Nom saisi dans le formulaire (champ `nom` de l'API) |
| `email` | String | Saisi dans le formulaire (en minuscules) ; reçoit l'accusé de réception |
| `telephone` | String? | Saisi dans le formulaire, obligatoire pour une nouvelle demande : Julie rappelle avant de répondre (vide pour d'anciennes demandes) |
| `typeDemande` | String | `experience`, `sponsoring`, `studio` ou `evenement` |
| `experienceId` | Int? | Clé étrangère vers `Experience`, optionnelle |
| `nbParticipants` | Int? | |
| `dateSouhaitee` | DateTime? | |
| `lieuSouhaite` | String? | `dans_les_locaux` (chez l'entreprise) ou `a_proximite` (lieu proche de l'entreprise) |
| `message` | String | |
| `statut` | String | `nouvelle`, `en_cours` ou `traitee` |
| `noteInterne` | String? | Note de Julie (ex : « Rappeler jeudi »), modifiable dans `/admin/devis`. Jamais montrée au client |
| `consentementLe` | DateTime? | Date à laquelle la case « politique de confidentialité » a été cochée (vide pour les demandes plus anciennes) |
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
| `nom` | String | Prénom et âge, ex : `Claire, 52 ans` |
| `citation` | String | Le témoignage |
| `contexte` | String | Ex : `Team building, atelier anti-gaspi` (affiché à la place de la date si elle est vide) |
| `note` | Int? | Note sur 5, optionnelle, affichée en carottes |
| `date` | DateTime? | Date de l'avis, affichée après le nom (`Claire, 52 ans • 27 juillet 2026`) |
| `demo` | Boolean | Avis fictif créé par le seed (« démo » dans l'admin) : à supprimer avant la mise en ligne |
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
| `consentementLe` | DateTime? | Date à laquelle la case « politique de confidentialité » a été cochée sur le site ; vide pour une adresse ajoutée dans l'admin |
| `createdAt` | DateTime | Date d'inscription |

## `TextePage`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `page` | String | `accueil`, `a-propos`, `studio`, `experiences`, `blog`, `confidentialite` ou `mentions-legales` |
| `cle` | String | Emplacement dans la page, ex : `titre`, `introduction`, `bouton`. Unique avec `page` |
| `texte` | String | Texte affiché, modifiable dans `/admin/textes` |
| `updatedAt` | DateTime | Dernière modification |

Les emplacements, leur libellé, leur forme (titre, paragraphe, bouton, texte de page) et leur texte d'origine sont définis dans
`src/backend/contenus/textes-par-defaut.ts`. Le seed crée les textes absents sans jamais remplacer un texte modifié ;
une page affiche le texte d'origine d'un emplacement qui n'est pas encore en base.

## `User`

Un compte d'administration : les visiteurs n'en ont pas (aucune inscription possible). Créé par le seed pour Julie,
ou ajouté par un admin dans `/admin/utilisateurs`.

| Colonne | Type | Détail |
|---|---|---|
| `id` | String | Clé primaire |
| `nom` | String | Champ `name` de Better Auth, stocké dans la colonne `nom` |
| `email` | String | Unique, en minuscules |
| `emailVerified` | Boolean | Exigé par Better Auth ; `true` pour les admins créés par le seed ou dans l'admin |
| `image` | String? | Champ de Better Auth, non utilisé |
| `role` | String | `admin` pour tous les comptes. La valeur par défaut reste `client`, sans aucun droit : un compte créé par erreur n'aurait accès à rien. Vérifié à chaque accès (`verifierAcces`) ; aucune route Better Auth ne permet de le changer |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

Le **mot de passe** n'est pas dans `User` : Better Auth le range, haché en **argon2id**, dans `AuthAccount`
(`providerId = "credential"`, `accountId` = id du compte). Le seed crée le compte admin à partir de
`ADMIN_EMAIL` et `ADMIN_PASSWORD` (`.env.local`) et ne remplace jamais le mot de passe d'un compte existant.
Un admin ajouté dans `/admin/utilisateurs` n'a pas encore d'`AuthAccount` : il est créé quand il choisit son mot de
passe avec le lien reçu par e-mail.

Le dernier compte `admin` ne peut pas être supprimé.

## Tables techniques de Better Auth

| Table | Rôle |
|---|---|
| `AuthSession` | Une connexion active : `token` (dans le cookie httpOnly), `expiresAt` (30 jours, repoussé à chaque visite, au plus une fois par jour), `ipAddress`, `userAgent`, `userId` |
| `AuthAccount` | Une méthode de connexion d'un compte : `providerId` (`credential`), `password` (haché), jetons OAuth inutilisés |
| `AuthVerification` | Jetons temporaires : choix ou réinitialisation du mot de passe (1 h, usage unique) |

Elles s'appellent `Auth…` pour ne pas entrer en conflit avec `Session` (les dates des expériences).
Ne pas les modifier à la main : elles suivent le format imposé par Better Auth.

## Migration `suppression_comptes_clients`

Les visiteurs n'ont plus de compte. Cette migration :
1. supprime les sessions, mots de passe et liens de réinitialisation en attente des comptes non admin ;
2. met à vide le lien vers le compte des réservations et des demandes de devis de ces clients, puis supprime leurs
   comptes : réservations et devis sont **conservés**, avec le nom, l'e-mail et le téléphone qui y étaient déjà copiés ;
3. retire les colonnes devenues inutiles : `Reservation.userId`, `DemandeDevis.userId` et `User.telephone`.

La migration suivante, `consentements`, ajoute `consentementLe` à `Reservation`, `DemandeDevis` et `Newsletter`.
Après les avoir appliquées (`npx prisma migrate dev`), redémarrer `npm run dev`.

