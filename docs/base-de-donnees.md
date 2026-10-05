# Base de données

## Vue d'ensemble

| Table | Rôle |
|---|---|
| `Experience` | Les offres : atelier, good tour, immersion |
| `ExperienceImage` | Galerie de photos d'une expérience |
| `Session` | Une date précise d'une expérience (lieu, places, prix) |
| `Reservation` | Une réservation B2C sur une session |
| `DemandeDevis` | Une demande de devis B2B |
| `Episode` | Un épisode du podcast La recette |
| `Reference` | Un client, partenaire ou témoignage (pour la crédibilité B2B) |
| `Newsletter` | Un e-mail inscrit à la newsletter |

Relations :

```
Experience 1 ──── n ExperienceImage
Experience 1 ──── n Session 1 ──── n Reservation
Experience 1 ──── n DemandeDevis   (optionnel)
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
| `prixCents` | Int | Prix par personne (B2C), en centimes |
| `prixEntrepriseCents` | Int? | Prix par personne (B2B), optionnel |
| `capaciteMax` | Int | Nombre maximum de participants |
| `lieu` | String? | Lieu habituel |
| `image` | String | **Image de couverture**, ex : `/images/ateliers/cover.jpg` |
| `imageAlt` | String | Texte alternatif de la couverture |
| `actif` | Boolean | Visible sur le site ou non |
| `createdAt` | DateTime | |

## `ExperienceImage`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `experienceId` | Int | Clé étrangère vers `Experience` |
| `url` | String | Ex : `/images/ateliers/photo-2.jpg` |
| `alt` | String | Texte alternatif |
| `ordre` | Int | Position dans la galerie |

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
| `createdAt` | DateTime | |

## `DemandeDevis`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `entreprise` | String | |
| `contactNom` | String | |
| `email` | String | |
| `telephone` | String? | |
| `typeDemande` | String | `experience` ou `podcast_studio` |
| `experienceId` | Int? | Clé étrangère vers `Experience`, optionnelle |
| `nbParticipants` | Int? | |
| `dateSouhaitee` | DateTime? | |
| `message` | String | |
| `statut` | String | `nouvelle`, `en_cours` ou `traitee` |
| `createdAt` | DateTime | |

## `Episode`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `numero` | Int | Numéro de l'épisode |
| `titre` | String | |
| `description` | String | |
| `invite` | String? | Chef ou producteur invité |
| `datePublication` | DateTime | |
| `dureeMin` | Int | |
| `image` | String | Visuel de l'épisode, ex : `/images/episodes/ep12.jpg` |
| `embedUrl` | String | Lien du lecteur Ausha |
| `spotifyUrl` | String? | |
| `deezerUrl` | String? | |
| `appleUrl` | String? | |
| `youtubeUrl` | String? | |

## `Reference`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `nom` | String | Nom du client ou partenaire |
| `type` | String | `client`, `partenaire` ou `temoignage` |
| `logo` | String? | Ex : `/images/references/logo-x.png` |
| `citation` | String? | Témoignage |
| `auteur` | String? | Qui parle |
| `ordre` | Int | Ordre d'affichage |

## `Newsletter`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `email` | String | Unique |
| `createdAt` | DateTime | |
