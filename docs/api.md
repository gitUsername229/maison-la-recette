# Routes API

Conventions :
- Les prix sont en **centimes** (`4500` = 45,00 €).
- Les dates sont au format ISO 8601 (`2026-11-14T10:00:00.000Z`).
- Les routes **admin** exigent le header `x-admin-key` (valeur dans `.env.local`). Sans lui : `401`.
- Erreurs : `400` (données invalides), `401` (non autorisé), `404` (introuvable), `409` (plus de places).

## Résumé

| Méthode | Route | Rôle | Accès |
|---|---|---|---|
| GET | `/api/experiences` | Liste des expériences | Public |
| GET | `/api/experiences/[slug]` | Une expérience avec images et sessions | Public |
| GET | `/api/sessions` | Sessions disponibles | Public |
| GET | `/api/episodes` | Liste des épisodes | Public |
| GET | `/api/references` | Références et témoignages | Public |
| GET | `/api/reservations?session_id=` | Réservation après paiement | Public |
| POST | `/api/checkout` | Réserver et payer | Public |
| POST | `/api/webhook` | Confirmation de paiement Stripe | Stripe |
| POST | `/api/devis` | Demande de devis | Public |
| POST | `/api/newsletter` | Inscription newsletter | Public |
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
| POST | `/api/images` | Envoyer une image | Admin |
| DELETE | `/api/images/[id]` | Supprimer une image de galerie | Admin |
