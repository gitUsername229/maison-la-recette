# Exemples curl

À faire avec le serveur lancé (`npm run dev`) et, pour voir les e-mails, Mailpit (http://localhost:8025).

```bash
export BASE=http://localhost:3000
```

Le site n'a ni compte ni administration : les seules écritures sont la demande de devis et l'inscription à la
newsletter. Événements (Luma) et épisodes (Ausha) sont lus côté serveur à l'affichage des pages, sans route API du site
(voir [api.md](api.md)).

Les deux formulaires (`/api/devis`, `/api/newsletter`) demandent :
- `"consentement": true` (case « politique de confidentialité » cochée ; sa date est enregistrée). Absent ou `false` :
  `400` avec `{ "champ": "consentement", "message": "Cochez la case pour accepter la politique de confidentialité." }`
  dans `details` ;
- de laisser vide le champ piège `siteWeb` (caché aux visiteurs). Rempli, on suppose un robot : réponse habituelle,
  mais rien n'est enregistré ni envoyé ;
- de ne pas dépasser la limite d'envois par adresse IP (en production : 5 devis et 5 inscriptions par 10 minutes ;
  20 fois plus en développement). Au-delà : `429` avec le temps
  restant, par exemple `{ "error": "Trop d’envois en peu de temps depuis votre connexion. Réessayez dans 7 minutes." }`.

## Demande de devis

`nom`, `entreprise`, `email` et `telephone` sont obligatoires (Julie rappelle avant de répondre).
`typeDemande` : `experience`, `sponsoring`, `studio` ou `evenement`. Seule une demande `experience` peut viser une
expérience, par son slug (`experience`, voir `src/contenu/experiences.ts`).

**Devis pour une expérience en entreprise**

```bash
curl -X POST "$BASE/api/devis" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Sophie Durand",
    "entreprise": "Entreprise Exemple",
    "email": "sophie@example.com",
    "telephone": "0600000000",
    "typeDemande": "experience",
    "experience": "immersion-producteur",
    "nbParticipants": 25,
    "dateSouhaitee": "2027-01-20",
    "lieuSouhaite": "dans_les_locaux",
    "message": "Nous cherchons un team building autour de l'\''alimentation durable.",
    "consentement": true
  }'
```

`lieuSouhaite` : `dans_les_locaux` (chez l'entreprise) ou `a_proximite`.

**Devis pour le studio podcast**

```bash
curl -X POST "$BASE/api/devis" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Sophie Durand",
    "entreprise": "Marque Exemple",
    "email": "sophie@example.com",
    "telephone": "0600000000",
    "typeDemande": "studio",
    "message": "Nous voulons lancer un podcast de marque.",
    "consentement": true
  }'
```

Les demandes `sponsoring` (sponsoriser le podcast) et `evenement` s'envoient de la même façon.

Réponse `201` (aucun identifiant interne n'est renvoyé) :

```json
{ "message": "Merci ! Julie vous rappelle sous 48 h pour en parler." }
```

Julie (`MAIL_ADMIN_TO`) reçoit le détail par e-mail (« répondre à » écrit directement au client) et le client un accusé
de réception qui récapitule sa demande (sa réponse arrive à Julie). La demande est aussi enregistrée en base.

Erreurs : expérience inconnue (`"experience": "inconnue"`), téléphone manquant, date passée ou champ inconnu (un ancien
`experienceId` par exemple) : `400` avec les champs en cause dans `details`.

## Newsletter

**S'inscrire** (l'adresse est enregistrée en minuscules, sans espaces, avec la date du consentement)

```bash
curl -X POST "$BASE/api/newsletter" \
  -H "Content-Type: application/json" \
  -d '{ "email": "lectrice@example.com", "consentement": true }'
```

Réponse `201`, identique si l'adresse était déjà inscrite (on ne révèle pas qui est abonné) :

```json
{ "message": "Merci ! Votre adresse est inscrite à la newsletter." }
```

Une nouvelle adresse est envoyée à Julie par e-mail ; une réinscription ne renvoie rien.
Adresse invalide : `400` avec `{ "champ": "email", "message": "Adresse e-mail invalide." }` dans `details`.

**Robot** (champ piège rempli) : même réponse `201`, rien d'enregistré ni d'envoyé.

```bash
curl -X POST "$BASE/api/newsletter" \
  -H "Content-Type: application/json" \
  -d '{ "email": "robot@example.com", "consentement": true, "siteWeb": "https://spam.example" }'
```

## Faux serveur Luma (simulation)

Seulement avec `LUMA_MODE=simulation` (par défaut) ; en mode `api`, ces adresses répondent `404`. Comme la vraie API,
il exige l'en-tête `x-luma-api-key` (n'importe quelle valeur en simulation).

**Prochains événements**, du plus proche au plus lointain

```bash
curl -H "x-luma-api-key: simulation" \
  "$BASE/api/luma-simule/v1/calendars/events/list?after=$(date -u +%Y-%m-%dT%H:%M:%SZ)&sort_column=start_at&sort_direction=asc"
```

Réponse `200` (extrait d'une entrée) :

```json
{
  "entries": [
    {
      "id": "evt-SimAtelier01",
      "name": "Atelier cuisine anti-gaspi",
      "start_at": "2026-10-17T16:30:00.000Z",
      "end_at": "2026-10-17T19:00:00.000Z",
      "timezone": "Europe/Paris",
      "url": "http://localhost:3000/luma-simule/evt-SimAtelier01",
      "visibility": "public",
      "location_visibility": "guests-only",
      "geo_address_json": { "city": "La Rochelle", "city_state": "La Rochelle, Nouvelle-Aquitaine" },
      "display_price": { "amount": 7000, "currency": "eur", "is_flexible": false },
      "spots_remaining": 8,
      "registration_open": true,
      "tags": [{ "id": "tag-atelier", "name": "Atelier" }]
    }
  ],
  "has_more": false
}
```

Les dates dépendent du jour : les événements fictifs sont placés par rapport à aujourd'hui.

**Pagination** : `pagination_limit=2` renvoie `"has_more": true` et `"next_cursor": "2"`, à passer ensuite dans
`pagination_cursor` :

```bash
curl -H "x-luma-api-key: simulation" \
  "$BASE/api/luma-simule/v1/calendars/events/list?pagination_limit=2&pagination_cursor=2"
```

**Un événement** (avec `description`, `description_md` et `hosts`)

```bash
curl -H "x-luma-api-key: simulation" "$BASE/api/luma-simule/v1/events/get?event_id=evt-SimFoodTour01"
```

Erreurs : sans l'en-tête, `401` `{ "message": "Missing x-luma-api-key header." }` ; sans `event_id`, `400` ;
identifiant inconnu, `404` `{ "message": "Event not found." }`.

## Santé

```bash
curl "$BASE/api/health"
```

Réponse `200` : `{ "name": "Maison La recette", "status": "ok" }`.
