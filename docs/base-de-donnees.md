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

Relations :

```
Experience 1 ──── n Session 1 ──── n Reservation
Experience 1 ──── n DemandeDevis   (optionnel)
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
| `nom` | String | |
| `email` | String | |
| `telephone` | String? | |
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
| `entreprise` | String | |
| `contactNom` | String | |
| `email` | String | |
| `telephone` | String | Obligatoire : Julie rappelle avant de répondre |
| `typeDemande` | String | `experience`, `sponsoring`, `studio` ou `evenement` |
| `experienceId` | Int? | Clé étrangère vers `Experience`, optionnelle |
| `nbParticipants` | Int? | |
| `dateSouhaitee` | DateTime? | |
| `lieuSouhaite` | String? | `dans_les_locaux` (chez l'entreprise) ou `a_proximite` (lieu proche de l'entreprise) |
| `message` | String | |
| `statut` | String | `nouvelle`, `en_cours` ou `traitee` |
| `createdAt` | DateTime | |

## `Episode`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `guid` | String | Unique, identifiant de l'épisode dans le flux RSS (évite les doublons à l'import) |
| `saison` | Int | Numéro de la saison |
| `numero` | Int | Numéro de l'épisode |
| `titre` | String | |
| `description` | String | Description complète, importée du flux RSS |
| `resume` | String | Texte affiché sur le site. Pré-rempli à l'import avec le début de la description, modifiable dans l'admin |
| `invite` | String? | Chef ou producteur invité |
| `datePublication` | DateTime | |
| `dureeMin` | Int | |
| `image` | String | Visuel de l'épisode (URL fournie par le flux Ausha) |
| `embedUrl` | String | Lien du lecteur Ausha |
| `spotifyUrl` | String? | |
| `deezerUrl` | String? | |
| `appleUrl` | String? | |
| `youtubeUrl` | String? | |

L'import (`POST /api/episodes/import`) crée ou met à jour les épisodes par `guid`. Il n'écrase pas les champs saisis dans l'admin (`resume`, `invite`, liens des plateformes).

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
| `page` | String | Chemin de la page qui affiche la galerie, ex : `/`, `/a-propos`, `/experiences/atelier-cuisine-anti-gaspi` |
| `ordre` | Int | Position dans la galerie |

## `Newsletter`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `email` | String | Unique |
| `createdAt` | DateTime | |
