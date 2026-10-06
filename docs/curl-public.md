# Exemples curl : routes publiques

À faire avec le serveur lancé (`npm run dev`).

```bash
export BASE=http://localhost:3000
```

## Expériences

**Lister toutes les expériences**

```bash
curl "$BASE/api/experiences"
```

**Filtrer par type** (`atelier`, `good_tour`, `immersion`)

```bash
curl "$BASE/api/experiences?type=atelier"
```

Réponse `200` :

```json
[
  {
    "id": 1,
    "slug": "atelier-cuisine-anti-gaspi",
    "type": "atelier",
    "titre": "Atelier cuisine anti-gaspi",
    "accroche": "Cuisiner avec ce qu'on jette d'habitude",
    "dureeMin": 150,
    "prixCents": 7000,
    "prixEntrepriseCents": 9000,
    "reservableEnLigne": true,
    "capaciteMax": 12,
    "image": "/images/ateliers/cover.jpg",
    "imageAlt": "Participants autour d'un plan de travail"
  }
]
```

Une immersion (surtout B2B) est sur devis uniquement : `reservableEnLigne` vaut `false` et le prix est vide.

```json
{
  "id": 3,
  "slug": "immersion-ferme-maraichere",
  "type": "immersion",
  "titre": "Immersion chez une maraîchère",
  "prixCents": null,
  "prixEntrepriseCents": null,
  "reservableEnLigne": false
}
```

**Détail d'une expérience (avec galerie et sessions à venir)**

```bash
curl "$BASE/api/experiences/atelier-cuisine-anti-gaspi"
```

Réponse `200` :

```json
{
  "id": 1,
  "slug": "atelier-cuisine-anti-gaspi",
  "type": "atelier",
  "titre": "Atelier cuisine anti-gaspi",
  "description": "Un atelier pour apprendre à ...",
  "dureeMin": 150,
  "prixCents": 7000,
  "reservableEnLigne": true,
  "capaciteMax": 12,
  "image": "/images/ateliers/cover.jpg",
  "images": [
    { "id": 1, "url": "/images/ateliers/photo-2.jpg", "alt": "Épluchures en cuisine", "ordre": 1 },
    { "id": 2, "url": "/images/ateliers/photo-3.jpg", "alt": "Dégustation", "ordre": 2 }
  ],
  "sessions": [
    {
      "id": 4,
      "dateDebut": "2026-11-14T10:00:00.000Z",
      "lieu": "La Rochelle",
      "placesRestantes": 8,
      "statut": "ouverte"
    }
  ]
}
```

`images` vient de la table `Image` (page `/experiences/atelier-cuisine-anti-gaspi`). Pour une expérience sur devis, `sessions` est vide et la page affiche le formulaire de devis.

Expérience inconnue : `404` avec `{ "error": "Expérience introuvable" }`.

## Sessions

**Sessions disponibles d'une expérience**

```bash
curl "$BASE/api/sessions?experience=atelier-cuisine-anti-gaspi&disponible=true"
```

Réponse `200` :

```json
[
  {
    "id": 4,
    "experienceId": 1,
    "dateDebut": "2026-11-14T10:00:00.000Z",
    "dateFin": "2026-11-14T12:30:00.000Z",
    "lieu": "La Rochelle",
    "placesTotal": 12,
    "placesRestantes": 8,
    "prixCents": 7000,
    "statut": "ouverte"
  }
]
```

## Épisodes du podcast

**Lister les épisodes (les plus récents d'abord)**

```bash
curl "$BASE/api/episodes"
```

**Limiter le nombre d'épisodes** (utile pour l'accueil)

```bash
curl "$BASE/api/episodes?limit=3"
```

**Filtrer par saison**

```bash
curl "$BASE/api/episodes?saison=2"
```

Réponse `200` :

```json
[
  {
    "id": 12,
    "saison": 2,
    "numero": 4,
    "titre": "Un chef contre le gaspillage",
    "resume": "Rencontre avec un chef qui cuisine les restes ...",
    "description": "...",
    "invite": "Nom du chef",
    "datePublication": "2026-09-20T05:00:00.000Z",
    "dureeMin": 42,
    "image": "https://image.ausha.co/...",
    "embedUrl": "https://player.ausha.co/...",
    "spotifyUrl": "https://open.spotify.com/episode/...",
    "deezerUrl": null,
    "appleUrl": null,
    "youtubeUrl": null
  }
]
```

Le site affiche `resume` ; `description` est le texte complet importé d'Ausha.

## Avis

```bash
curl "$BASE/api/avis"
```

Réponse `200` (seulement les avis visibles) :

```json
[
  {
    "id": 1,
    "nom": "Claire D.",
    "citation": "Une journée qui a soudé l'équipe.",
    "contexte": "Team building, atelier anti-gaspi",
    "note": 5
  },
  {
    "id": 2,
    "nom": "Marc L.",
    "citation": "On repart avec plein d'idées pour cuisiner autrement.",
    "contexte": "Good tour du marché",
    "note": null
  }
]
```

## Partenaires

```bash
curl "$BASE/api/partenaires"
```

Réponse `200` (seulement les partenaires qui ont donné leur accord) :

```json
[
  {
    "id": 1,
    "nom": "Nom de la maraîchère",
    "metier": "Maraîchère",
    "photo": "/images/partenaires/maraichere.jpg",
    "photoAlt": "La maraîchère dans ses serres",
    "description": "Légumes de saison cultivés à ..."
  }
]
```

Tant qu'aucun partenaire n'est visible : `[]`.

## Blog

**Lister les articles publiés (les plus récents d'abord)**

```bash
curl "$BASE/api/articles"
```

**Limiter le nombre d'articles**

```bash
curl "$BASE/api/articles?limit=3"
```

Réponse `200` :

```json
[
  {
    "id": 2,
    "slug": "cuisiner-les-epluchures",
    "titre": "Cuisiner les épluchures : 5 idées simples",
    "extrait": "Chips, bouillons, pestos : les épluchures ont de la ressource.",
    "image": "/images/blog/epluchures.jpg",
    "imageAlt": "Épluchures de légumes sur une planche",
    "datePublication": "2026-10-01T08:00:00.000Z"
  }
]
```

**Lire un article** (page `/blog/cuisiner-les-epluchures`)

```bash
curl "$BASE/api/articles/cuisiner-les-epluchures"
```

Réponse `200` :

```json
{
  "id": 2,
  "slug": "cuisiner-les-epluchures",
  "titre": "Cuisiner les épluchures : 5 idées simples",
  "extrait": "Chips, bouillons, pestos : les épluchures ont de la ressource.",
  "contenu": "## 1. Des chips d'épluchures\n\n...",
  "image": "/images/blog/epluchures.jpg",
  "imageAlt": "Épluchures de légumes sur une planche",
  "datePublication": "2026-10-01T08:00:00.000Z"
}
```

Article inconnu ou brouillon : `404` avec `{ "error": "Article introuvable" }`.

## Galeries photos

**Photos d'une page** (`page` est le chemin de la page)

```bash
curl "$BASE/api/images?page=/a-propos"
```

Réponse `200` (triée par `ordre`) :

```json
[
  { "id": 5, "url": "/images/a-propos/cuisine.jpg", "alt": "Julie en cuisine", "page": "/a-propos", "ordre": 1 },
  { "id": 6, "url": "/images/a-propos/marche.jpg", "alt": "Étal de légumes au marché", "page": "/a-propos", "ordre": 2 }
]
```

## Réserver et payer (B2C)

Seulement pour les expériences réservables en ligne (`reservableEnLigne: true`).

**Créer la réservation et la session de paiement Stripe**

```bash
curl -X POST "$BASE/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 4,
    "nom": "Camille Martin",
    "email": "camille@example.com",
    "telephone": "0600000000",
    "nbPersonnes": 2
  }'
```

Réponse `200` :

```json
{
  "reservationId": 7,
  "montantCents": 14000,
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

Le front redirige vers `checkoutUrl`. Sur la page Stripe, payer avec `4242 4242 4242 4242`.

Erreurs possibles :

```json
{ "error": "Il ne reste que 1 place" }
```
(code `409`)

```json
{ "error": "nbPersonnes doit être supérieur à 0" }
```
(code `400`)

```json
{ "error": "Cette expérience se réserve uniquement sur devis" }
```
(code `400`)

**Retrouver la réservation après le paiement** (page `/reservation/succes?session_id=cs_test_...`)

```bash
curl "$BASE/api/reservations?session_id=cs_test_a1B2c3"
```

Réponse `200` :

```json
{
  "id": 7,
  "nom": "Camille Martin",
  "nbPersonnes": 2,
  "montantCents": 14000,
  "statut": "payee",
  "session": {
    "dateDebut": "2026-11-14T10:00:00.000Z",
    "lieu": "La Rochelle",
    "experience": "Atelier cuisine anti-gaspi"
  }
}
```

## Webhook Stripe

Cette route est appelée par Stripe, pas à la main : la signature du message est vérifiée. En local, on passe par la Stripe CLI.

```bash
# Terminal 1 : le site
npm run dev

# Terminal 2 : redirige les événements Stripe vers le site
stripe listen --forward-to localhost:3000/api/webhook
# → affiche un secret "whsec_..." à copier dans .env.local (STRIPE_WEBHOOK_SECRET)

# Terminal 3 (optionnel) : simuler un paiement réussi sans passer par le navigateur
stripe trigger checkout.session.completed
```

Quand l'événement `checkout.session.completed` arrive : la réservation passe à `payee` et `placesPrises` augmente.

## Demande de devis (B2B)

`typeDemande` : `experience`, `sponsoring`, `studio` ou `evenement`. Le `telephone` est obligatoire : Julie rappelle d'abord.

**Devis pour une expérience en entreprise**

```bash
curl -X POST "$BASE/api/devis" \
  -H "Content-Type: application/json" \
  -d '{
    "entreprise": "Entreprise Exemple",
    "contactNom": "Julien Dupont",
    "email": "julien@exemple.fr",
    "telephone": "0611223344",
    "typeDemande": "experience",
    "experienceId": 3,
    "nbParticipants": 25,
    "dateSouhaitee": "2027-01-20",
    "lieuSouhaite": "dans_les_locaux",
    "message": "Nous cherchons un team building autour de l'\''alimentation durable."
  }'
```

`lieuSouhaite` : `dans_les_locaux` (chez l'entreprise) ou `a_proximite`.

**Devis pour le studio podcast**

```bash
curl -X POST "$BASE/api/devis" \
  -H "Content-Type: application/json" \
  -d '{
    "entreprise": "Marque Exemple",
    "contactNom": "Sophie Leroy",
    "email": "sophie@marque.fr",
    "telephone": "0622334455",
    "typeDemande": "studio",
    "message": "Nous voulons lancer un podcast de marque."
  }'
```

Les demandes `sponsoring` (sponsoriser le podcast) et `evenement` s'envoient de la même façon.

Réponse `201` :

```json
{
  "id": 3,
  "statut": "nouvelle",
  "message": "Merci ! Votre demande est bien reçue, nous vous répondons sous 48h."
}
```

Un e-mail avec le détail de la demande est envoyé à Julie (`MAIL_DEVIS_TO`). En local, il arrive dans Mailpit : http://localhost:8025.

Téléphone manquant : `400` avec `{ "error": "Le téléphone est obligatoire" }`.

## Newsletter

```bash
curl -X POST "$BASE/api/newsletter" \
  -H "Content-Type: application/json" \
  -d '{ "email": "camille@example.com" }'
```

Réponse `201` : `{ "ok": true }`. E-mail déjà inscrit : `409`.
