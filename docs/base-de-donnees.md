# Base de données

SQLite (`prisma/dev.db` en local), schéma dans `prisma/schema.prisma`. La base ne garde que ce que les visiteurs
envoient par les deux formulaires du site, aussi envoyé par e-mail à Julie (`MAIL_ADMIN_TO`). Tout le reste vient
d'ailleurs :

| Donnée | Source |
|---|---|
| Événements (dates, lieu, prix, places, inscriptions, paiements) | Luma, lu à l'affichage (`src/backend/luma/`) |
| Épisodes du podcast | Flux RSS Ausha, lu à l'affichage (`src/backend/podcast/`) |
| Textes, expériences, avis, partenaires, photos, liens | Fichiers de `src/contenu/` |
| Articles du blog | Fichiers Markdown de `src/contenu/blog/` |

## Vue d'ensemble

| Table | Rôle |
|---|---|
| `DemandeDevis` | Une demande de devis du formulaire `/contact` (expérience, sponsoring, studio, événement) |
| `Newsletter` | Une adresse inscrite à la newsletter (formulaire de l'accueil) |

Aucune relation : une demande de devis vise une expérience par son slug, sans clé étrangère (les expériences sont
dans le code). Ni l'une ni l'autre n'est liée à un compte : les coordonnées saisies sont enregistrées avec elles.

## `DemandeDevis`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `entreprise` | String | Saisie dans le formulaire |
| `contactNom` | String | Nom saisi dans le formulaire (champ `nom` de l'API) |
| `email` | String | Saisi dans le formulaire (en minuscules) ; reçoit l'accusé de réception |
| `telephone` | String? | Obligatoire pour une nouvelle demande : Julie rappelle avant de répondre (vide pour d'anciennes demandes) |
| `typeDemande` | String | `experience`, `sponsoring`, `studio` ou `evenement` |
| `experience` | String? | Slug de l'expérience visée (`src/contenu/experiences.ts`), pour une demande `experience` |
| `nbParticipants` | Int? | |
| `dateSouhaitee` | DateTime? | |
| `lieuSouhaite` | String? | `dans_les_locaux` (chez l'entreprise) ou `a_proximite` (lieu proche de l'entreprise) |
| `message` | String | |
| `consentementLe` | DateTime? | Date à laquelle la case « politique de confidentialité » a été cochée (vide pour les demandes plus anciennes) |
| `createdAt` | DateTime | |

## `Newsletter`

| Colonne | Type | Détail |
|---|---|---|
| `id` | Int | Clé primaire |
| `email` | String | Unique, enregistré en minuscules et sans espaces |
| `consentementLe` | DateTime? | Date à laquelle la case « politique de confidentialité » a été cochée (mise à jour à chaque réinscription) |
| `createdAt` | DateTime | Date d'inscription |

## Consulter les données

Sans administration, les demandes et les inscriptions arrivent par e-mail à Julie. Pour voir la base en local :

```bash
npx prisma studio      # http://localhost:5555, lecture et export
```

## Migration `contenus_fixes_luma`

Passage aux contenus fixes et à Luma. Cette migration :
1. garde les demandes de devis : l'ancienne clé `experienceId` devient le slug de l'expérience (`experience`) ; les
   colonnes de l'administration (`statut`, `noteInterne`) sont retirées ;
2. garde les inscriptions à la newsletter telles quelles ;
3. supprime les tables devenues inutiles : `Experience`, `Session`, `Reservation`, `Episode`, `Article` (et ses liens
   aux expériences), `Avis`, `Partenaire`, `Image`, `TextePage`, `User` et les tables de connexion (`AuthSession`,
   `AuthAccount`, `AuthVerification`).

Après l'avoir appliquée (`npx prisma migrate dev`), redémarrer `npm run dev`, qui garde sinon l'ancien client Prisma.
Les migrations précédentes restent dans `prisma/migrations/` : elles construisent l'historique de la base, ne pas les
modifier.
