# Routes API

Voir [le guide ateliers/Stripe](ateliers-stripe.md) pour les comportements détaillés des réservations
et [les exemples curl](curl-public.md) ([admin](curl-admin.md)).
`POST /api/checkout` accepte un header `Idempotency-Key` contenant un UUID,
à conserver lors des nouvelles tentatives d'une même réservation. Sans ce header,
une clé est générée par le serveur pour rester compatible avec le formulaire existant ;
des appels répétés sans clé peuvent alors créer des réservations distinctes.

Conventions :
- Les prix sont en **centimes** (`7000` = 70,00 €).
- Les dates sont au format ISO 8601 (`2026-11-14T10:00:00.000Z`).
- **Accès** (contrôle unique : `src/backend/auth/acces.ts`) :
  - **Public** : sans compte ;
  - **Connecté** : cookie de session d'un compte (client ou admin). Le `userId`, le nom et l'e-mail
    viennent toujours de la session, jamais du corps de la requête ;
  - **Admin** : cookie de session d'un compte au rôle `admin`. En développement seulement, le header
    `x-admin-key` (valeur dans `.env.local`) le remplace pour les tests curl ; il est refusé en production.
- Les GET publics ne renvoient que le contenu visible (`actif`, `visible` ou `publie` à `true`). Avec l'accès admin, ils renvoient tout (brouillons, contenus masqués, sessions passées).
- Toutes les entrées sont validées (zod) ; un champ inconnu est refusé.
- Erreurs : `400` (données invalides, avec `details` : champs en cause), `401` (non connecté), `403` (rôle insuffisant),
  `404` (introuvable, ou réservation d'un autre client), `409` (plus de places, conflit, suppression refusée, dernier admin),
  `500` (problème technique, détail seulement dans le journal du serveur).
- Corps d'une erreur : `{ "error": "…", "details": [{ "champ": "prixCents", "message": "Champ obligatoire." }], "suggestion": "masquer" }`.
  `error` et `details` sont en français simple, prêts à afficher ; l'admin place chaque message sous son champ.
  `suggestion` (`masquer` ou `fermer`) indique l'action à proposer quand une suppression est refusée.
- Les cookies de session sont `httpOnly` et `SameSite=Lax` : un autre site ne peut pas envoyer de requête
  POST, PUT, PATCH ou DELETE avec la session d'un utilisateur.

## Résumé

| Méthode | Route | Rôle | Accès |
|---|---|---|---|
| POST | `/api/auth/sign-up/email` | Créer un compte (rôle `client`) | Public |
| POST | `/api/auth/sign-in/email` | Se connecter | Public |
| POST | `/api/auth/sign-out` | Se déconnecter | Connecté |
| GET | `/api/auth/get-session` | Session en cours | Public |
| POST | `/api/auth/request-password-reset` | Mot de passe oublié : envoie le lien par e-mail (même réponse qu'un compte existe ou non) | Public |
| POST | `/api/auth/reset-password` | Nouveau mot de passe avec le jeton du lien (valable 1 h, usage unique) | Public |
| GET | `/api/auth/verify-email?token=` | Lien de vérification de l'adresse (envoyé à l'inscription) | Public |
| POST | `/api/auth/send-verification-email` | Renvoyer le lien de vérification | Public |
| GET | `/api/compte` | Mon compte, mes réservations et mes demandes de devis | Connecté |
| GET | `/api/experiences` | Liste des expériences (`?type=`) | Public |
| GET | `/api/experiences/[slug]` | Une expérience avec galerie et sessions | Public |
| GET | `/api/sessions` | Sessions disponibles (`?experience=`, `?disponible=true`) | Public |
| GET | `/api/episodes` | Liste des épisodes, les plus récents d'abord (`?type=complet\|extrait\|replay`, `?saison=`, `?limit=`) | Public |
| GET | `/api/avis` | Avis clients visibles | Public |
| GET | `/api/partenaires` | Partenaires visibles | Public |
| GET | `/api/articles` | Articles publiés du blog, avec le libellé de leur catégorie (`?categorie=`, `?limit=`) | Public |
| GET | `/api/articles/[slug]` | Un article du blog | Public |
| GET | `/api/blog/categories` | Les 4 catégories du blog dans l'ordre (`valeur`, `libelle`, `description`) | Public |
| GET | `/api/images?page=` | Galerie photos d'une page | Public |
| GET | `/api/textes?page=` | Textes fixes d'une page (`accueil`, `a-propos`, `studio`, `blog`), avec leur texte d'origine | Public |
| POST | `/api/checkout` | Réserver et payer (expériences réservables en ligne) | Connecté |
| GET | `/api/reservations?session_id=` | Réservation après paiement | Connecté (propriétaire) |
| POST | `/api/webhook` | Confirmation de paiement Stripe | Stripe |
| POST | `/api/devis` | Demande de devis | Connecté |
| GET | `/api/reservations` | Toutes les réservations (`?statut=`) | Admin |
| PATCH | `/api/reservations/[id]` | Annuler une réservation | Admin |
| GET | `/api/devis` | Toutes les demandes de devis (`?statut=`) | Admin |
| PATCH | `/api/devis/[id]` | Changer le statut ou la note interne d'un devis (note jamais montrée au client) | Admin |
| DELETE | `/api/devis/[id]` | Supprimer une demande de devis | Admin |
| POST | `/api/experiences` | Créer une expérience | Admin |
| PUT | `/api/experiences/[id]` | Modifier, masquer (`actif: false`) ou afficher une expérience | Admin |
| DELETE | `/api/experiences/[id]` | Supprimer une expérience sans session (sinon `409`, `suggestion: masquer`) | Admin |
| POST | `/api/sessions` | Créer une session | Admin |
| PUT | `/api/sessions/[id]` | Modifier, fermer (`statut: complete`) ou rouvrir une session | Admin |
| DELETE | `/api/sessions/[id]` | Supprimer une session sans réservation (sinon `409`, `suggestion: fermer`) | Admin |
| POST | `/api/episodes/import` | Importer ou mettre à jour les épisodes depuis le flux Ausha (`AUSHA_RSS_URL`) | Admin |
| POST | `/api/episodes` | Ajouter un épisode | Admin |
| PUT | `/api/episodes/[id]` | Modifier un épisode (type, résumé, invité, liens) | Admin |
| DELETE | `/api/episodes/[id]` | Supprimer un épisode | Admin |
| POST | `/api/articles` | Créer un article (`categorie`, `episodeId` et `experienceIds` facultatifs) | Admin |
| PUT | `/api/articles/[id]` | Modifier, (dé)publier un article ou changer ses liens (`experienceIds` remplace les expériences liées) | Admin |
| DELETE | `/api/articles/[id]` | Supprimer un article | Admin |
| POST | `/api/avis` | Ajouter un avis | Admin |
| PUT | `/api/avis/[id]` | Modifier, afficher ou masquer un avis | Admin |
| DELETE | `/api/avis/[id]` | Supprimer un avis | Admin |
| POST | `/api/partenaires` | Ajouter un partenaire | Admin |
| PUT | `/api/partenaires/[id]` | Modifier, afficher ou masquer un partenaire | Admin |
| DELETE | `/api/partenaires/[id]` | Supprimer un partenaire | Admin |
| POST | `/api/images/fichier` | Envoyer une photo (JPG, PNG, WebP, 5 Mo max) → son chemin | Admin |
| POST | `/api/images` | Ajouter une photo à la galerie d'une page | Admin |
| PUT | `/api/images/[id]` | Modifier le texte alternatif, la page ou l'ordre | Admin |
| DELETE | `/api/images/[id]` | Retirer une photo de galerie (le fichier est effacé du disque) | Admin |
| POST | `/api/newsletter` | S'inscrire à la newsletter (même réponse si l'adresse était déjà inscrite) | Public |
| PUT | `/api/textes/[id]` | Modifier un texte des pages (`{ "texte": "…" }` ; longueur et caractère obligatoire selon l'emplacement) | Admin |
| GET | `/api/newsletter` | Lister les inscrits | Admin |
| PUT | `/api/newsletter/[id]` | Corriger une adresse | Admin |
| DELETE | `/api/newsletter/[id]` | Désinscrire une adresse | Admin |
| GET | `/api/utilisateurs` | Lister les comptes | Admin |
| PATCH | `/api/utilisateurs/[id]` | Modifier le nom, le téléphone ou le rôle d'un compte | Admin |
| DELETE | `/api/utilisateurs/[id]` | Supprimer un compte (réservations et devis conservés) | Admin |

**Règles de suppression** (pour ne jamais casser l'historique) :
- une expérience qui a des sessions ne se supprime pas : on la masque ;
- une session qui a des réservations ne se supprime pas : on la ferme. Ses places ne descendent pas sous les places
  déjà réservées (payées ou en cours de paiement), et elle ne peut être ni déplacée ni annulée tant qu'il y en a ;
- une réservation ne se supprime jamais (historique, comptabilité) : on l'annule ;
- un fichier envoyé (photo, couverture d'expérience ou d'article, photo de partenaire) est effacé du disque quand
  il est remplacé ou que son contenu est supprimé, sauf s'il sert encore ailleurs sur le site ;
- le dernier compte admin ne peut être ni rétrogradé ni supprimé (`409`).

**E-mails envoyés** (après la réponse, voir `src/backend/mails/`) : confirmation de réservation et information à Julie
après le webhook de paiement, détail du devis à Julie et accusé au client après `POST /api/devis`, lien de mot de passe
oublié, lien de vérification à l'inscription.

**Référencement** : `/sitemap.xml` (pages publiques, expériences visibles, articles publiés et catégories qui en ont,
recalculé à chaque demande) et `/robots.txt` (exclut `/admin`, `/compte`, `/connexion`, `/inscription`, les pages de mot de
passe et de réservation, et `/api/`). Chaque article a son titre, sa description (l'extrait), son adresse canonique et ses
balises de partage (Open Graph, X) avec la couverture.
