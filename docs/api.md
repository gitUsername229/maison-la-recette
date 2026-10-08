# Routes API

Le site n'a ni compte ni administration : les routes API se limitent aux deux formulaires publics, au faux serveur
Luma (simulation) et à une route de santé. Les événements (Luma) et les épisodes (Ausha) sont lus côté serveur à
l'affichage des pages, sans route API du site. Exemples : [curl-public.md](curl-public.md).

## Résumé

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/devis` | Demande de devis : `nom`, `entreprise`, `email`, `telephone`, `typeDemande`, `message`, champs facultatifs, `consentement`. Répond `201` `{ "message": "…" }` |
| POST | `/api/newsletter` | Inscription à la newsletter : `email`, `consentement`. Même réponse `201` si l'adresse était déjà inscrite |
| GET | `/api/luma-simule/v1/calendars/events/list` | Faux serveur Luma : événements du calendrier (`after`, `before`, `sort_column`, `sort_direction`, `pagination_limit`, `pagination_cursor`) |
| GET | `/api/luma-simule/v1/events/get?event_id=evt-…` | Faux serveur Luma : un événement, avec sa description et ses organisateurs |
| GET | `/api/health` | `{ "name": "Maison La recette", "status": "ok" }` |

Les anciennes routes (administration, connexion, contenus, épisodes, réservation et paiement Stripe) n'existent plus
et répondent `404`.

## Formulaires publics (`/api/devis`, `/api/newsletter`)

- Case de consentement obligatoire (`"consentement": true`, date enregistrée en base).
- Champ piège `siteWeb` : rempli (robot), la réponse est la même que d'habitude, mais rien n'est enregistré ni envoyé.
- Limite d'envois par adresse IP : `429` au-delà (voir le README).
- Entrées validées par zod ; un champ inconnu est refusé.
- Après la réponse, e-mails envoyés en arrière-plan (`src/backend/mails/`) : un échec est journalisé sans annuler
  l'enregistrement.
  - Devis : le détail à Julie (`MAIL_ADMIN_TO`, « répondre à » écrit au client) et un accusé de réception au client
    (sa réponse arrive à Julie).
  - Newsletter : chaque **nouvelle** adresse est envoyée à Julie (une réinscription ne renvoie rien).

**Devis** : `typeDemande` vaut `experience`, `sponsoring`, `studio` ou `evenement`. `experience` (facultatif, seulement
pour une demande `experience`) est le **slug** d'une expérience de `src/contenu/experiences.ts`. `nbParticipants`,
`dateSouhaitee` (future, `AAAA-MM-JJ`) et `lieuSouhaite` (`dans_les_locaux` ou `a_proximite`) sont facultatifs.

Erreurs :
- `400` : données invalides, avec `details` pour les champs en cause ;
- `429` : trop d'envois depuis la même adresse IP ;
- `500` : problème technique (le détail est seulement dans le journal du serveur).

Corps d'une erreur : `{ "error": "…", "details": [{ "champ": "email", "message": "Adresse e-mail invalide." }] }`,
en français simple, prêt à afficher sous le champ.

## Faux serveur Luma (`/api/luma-simule/v1/…`)

Il reproduit les deux GET de l'API publique Luma que le site utilise, avec les mêmes paramètres et les mêmes formats
de réponse (spécification : https://public-api.luma.com/openapi.json). Le client `src/backend/luma/client.ts`
l'appelle exactement comme la vraie API : seule l'adresse de base change (`LUMA_MODE`).

- Il n'existe qu'avec `LUMA_MODE=simulation` (par défaut). En mode `api`, il répond `404`.
- L'en-tête `x-luma-api-key` est exigé comme sur la vraie API (n'importe quelle valeur), sinon `401`.
- Données fictives dans `src/backend/luma/simulation.ts` : 7 événements datés par rapport au jour (ateliers à 70 €,
  food tours à 60 €, quelques événements passés, un presque complet, un sans limite de places).
- Le lien `url` de chaque événement mène à la page factice `/luma-simule/[id]`, marquée « Simulation Luma ».

**Liste** : `{ "entries": [ … ], "has_more": true, "next_cursor": "50" }`.
- `next_cursor` est présent seulement s'il reste des événements ; il se renvoie dans `pagination_cursor`.
- Chaque entrée est un événement avec ses `tags` (étiquettes Luma) et `submitted_by`.
- Champs lus par le site : `id`, `name`, `start_at`, `end_at`, `timezone`, `url`, `visibility`, `geo_address_json`,
  `display_price` (`amount` en centimes, `currency` en minuscules), `spots_remaining`, `registration_open` et `tags`.

**Détail** : l'événement directement, avec en plus `description`, `description_md` et `hosts`.
`400` sans `event_id`, `404` pour un identifiant inconnu.

## Référencement

- `/sitemap.xml` : pages publiques, expériences et articles publiés, recalculé à chaque demande.
- `/robots.txt` : exclut `/api/` et la page factice `/luma-simule/`, elle-même en `noindex`.
- Chaque article et chaque expérience a son titre, sa description, son adresse canonique et ses balises de partage
  (Open Graph, X).
