# Routes API

Conventions :
- Les prix sont en **centimes** (`7000` = 70,00 €).
- Les dates sont au format ISO 8601 (`2026-11-14T10:00:00.000Z`).
- Les routes **admin** exigent soit le cookie de session de l'interface `/admin` (obtenu avec le mot de passe), soit le header `x-admin-key` (pour les devs, valeur dans `.env.local`). Sans l'un ni l'autre : `401`.
- Les GET publics ne renvoient que le contenu visible (`actif`, `visible` ou `publie` à `true`). Avec l'accès admin, ils renvoient tout (brouillons, contenus masqués).
- Erreurs : `400` (données invalides), `401` (non autorisé), `404` (introuvable), `409` (plus de places).

## Résumé

| Méthode | Route | Rôle | Accès |
|---|---|---|---|
| GET | `/api/experiences` | Liste des expériences | Public |
| GET | `/api/experiences/[slug]` | Une expérience avec galerie et sessions | Public |
| GET | `/api/sessions` | Sessions disponibles | Public |
| GET | `/api/episodes` | Liste des épisodes (filtre par saison) | Public |
| GET | `/api/avis` | Avis clients visibles | Public |
| GET | `/api/partenaires` | Partenaires visibles | Public |
| GET | `/api/articles` | Articles publiés du blog | Public |
| GET | `/api/articles/[slug]` | Un article du blog | Public |
| GET | `/api/images?page=` | Galerie photos d'une page | Public |
| GET | `/api/reservations?session_id=` | Réservation après paiement | Public |
| POST | `/api/checkout` | Réserver et payer (expériences réservables en ligne) | Public |
| POST | `/api/webhook` | Confirmation de paiement Stripe | Stripe |
| POST | `/api/devis` | Demande de devis + e-mail à Julie | Public |
| POST | `/api/newsletter` | Inscription newsletter | Public |
| POST | `/api/admin/connexion` | Connexion à l'interface admin (mot de passe) | Public |
| POST | `/api/admin/deconnexion` | Déconnexion de l'interface admin | Admin |
| GET | `/api/reservations` | Toutes les réservations | Admin |
| PATCH | `/api/reservations/[id]` | Annuler une réservation | Admin |
| GET | `/api/devis` | Toutes les demandes de devis | Admin |
| PATCH | `/api/devis/[id]` | Changer le statut d'un devis | Admin |
| POST | `/api/experiences` | Créer une expérience | Admin |
| PUT | `/api/experiences/[id]` | Modifier une expérience | Admin |
| DELETE | `/api/experiences/[id]` | Supprimer une expérience | Admin |
| POST | `/api/sessions` | Créer une session | Admin |
| PUT | `/api/sessions/[id]` | Modifier une session | Admin |
| DELETE | `/api/sessions/[id]` | Supprimer une session | Admin |
| POST | `/api/episodes/import` | Importer les épisodes depuis le flux RSS Ausha | Admin |
| PUT | `/api/episodes/[id]` | Modifier un épisode (résumé, invité, liens) | Admin |
| POST | `/api/articles` | Créer un article | Admin |
| PUT | `/api/articles/[id]` | Modifier ou (dé)publier un article | Admin |
| DELETE | `/api/articles/[id]` | Supprimer un article | Admin |
| POST | `/api/avis` | Ajouter un avis | Admin |
| PUT | `/api/avis/[id]` | Modifier, afficher ou masquer un avis | Admin |
| DELETE | `/api/avis/[id]` | Supprimer un avis | Admin |
| POST | `/api/partenaires` | Ajouter un partenaire | Admin |
| PUT | `/api/partenaires/[id]` | Modifier, afficher ou masquer un partenaire | Admin |
| DELETE | `/api/partenaires/[id]` | Supprimer un partenaire | Admin |
| POST | `/api/images` | Envoyer une image (et l'ajouter à une galerie) | Admin |
| PUT | `/api/images/[id]` | Modifier le texte alternatif ou l'ordre d'une image | Admin |
| DELETE | `/api/images/[id]` | Supprimer une image de galerie | Admin |
