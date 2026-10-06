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
  `404` (introuvable, ou réservation d'un autre client), `409` (plus de places, conflit, dernier admin).
- Les cookies de session sont `httpOnly` et `SameSite=Lax` : un autre site ne peut pas envoyer de requête
  POST, PUT, PATCH ou DELETE avec la session d'un utilisateur.

## Résumé

| Méthode | Route | Rôle | Accès |
|---|---|---|---|
| POST | `/api/auth/sign-up/email` | Créer un compte (rôle `client`) | Public |
| POST | `/api/auth/sign-in/email` | Se connecter | Public |
| POST | `/api/auth/sign-out` | Se déconnecter | Connecté |
| GET | `/api/auth/get-session` | Session en cours | Public |
| GET | `/api/compte` | Mon compte, mes réservations et mes demandes de devis | Connecté |
| GET | `/api/experiences` | Liste des expériences (`?type=`) | Public |
| GET | `/api/experiences/[slug]` | Une expérience avec galerie et sessions | Public |
| GET | `/api/sessions` | Sessions disponibles (`?experience=`, `?disponible=true`) | Public |
| GET | `/api/episodes` | Liste des épisodes (`?saison=`, `?limit=`) | Public |
| GET | `/api/avis` | Avis clients visibles | Public |
| GET | `/api/partenaires` | Partenaires visibles | Public |
| GET | `/api/articles` | Articles publiés du blog (`?limit=`) | Public |
| GET | `/api/articles/[slug]` | Un article du blog | Public |
| GET | `/api/images?page=` | Galerie photos d'une page | Public |
| POST | `/api/checkout` | Réserver et payer (expériences réservables en ligne) | Connecté |
| GET | `/api/reservations?session_id=` | Réservation après paiement | Connecté (propriétaire) |
| POST | `/api/webhook` | Confirmation de paiement Stripe | Stripe |
| POST | `/api/devis` | Demande de devis | Connecté |
| GET | `/api/reservations` | Toutes les réservations (`?statut=`) | Admin |
| PATCH | `/api/reservations/[id]` | Annuler une réservation | Admin |
| GET | `/api/devis` | Toutes les demandes de devis (`?statut=`) | Admin |
| PATCH | `/api/devis/[id]` | Changer le statut d'un devis | Admin |
| POST | `/api/experiences` | Créer une expérience | Admin |
| PUT | `/api/experiences/[id]` | Modifier une expérience | Admin |
| DELETE | `/api/experiences/[id]` | Supprimer une expérience | Admin |
| POST | `/api/sessions` | Créer une session | Admin |
| PUT | `/api/sessions/[id]` | Modifier une session | Admin |
| DELETE | `/api/sessions/[id]` | Supprimer une session | Admin |
| POST | `/api/episodes` | Ajouter un épisode | Admin |
| PUT | `/api/episodes/[id]` | Modifier un épisode (résumé, invité, liens) | Admin |
| DELETE | `/api/episodes/[id]` | Supprimer un épisode | Admin |
| POST | `/api/articles` | Créer un article | Admin |
| PUT | `/api/articles/[id]` | Modifier ou (dé)publier un article | Admin |
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
| DELETE | `/api/images/[id]` | Retirer une photo de galerie | Admin |
| GET | `/api/utilisateurs` | Lister les comptes | Admin |
| PATCH | `/api/utilisateurs/[id]` | Modifier le nom, le téléphone ou le rôle d'un compte | Admin |
| DELETE | `/api/utilisateurs/[id]` | Supprimer un compte (réservations et devis conservés) | Admin |

Le dernier compte admin ne peut être ni rétrogradé ni supprimé (`409`).

**Prévues, pas encore implémentées** : `POST /api/episodes/import` (import du flux RSS Ausha),
`POST /api/newsletter`, et l'envoi d'e-mails (confirmation de réservation, devis à Julie).
