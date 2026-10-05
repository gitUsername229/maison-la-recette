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
    "prixCents": 4500,
    "prixEntrepriseCents": 6500,
    "capaciteMax": 12,
    "image": "/images/ateliers/cover.jpg",
    "imageAlt": "Participants autour d'un plan de travail"
  }
]
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
  "prixCents": 4500,
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
    "prixCents": 4500,
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

Réponse `200` :

```json
[
  {
    "id": 12,
    "numero": 12,
    "titre": "Un chef contre le gaspillage",
    "description": "...",
    "invite": "Nom du chef",
    "datePublication": "2026-09-20T05:00:00.000Z",
    "dureeMin": 42,
    "image": "/images/episodes/ep12.jpg",
    "embedUrl": "https://player.ausha.co/...",
    "spotifyUrl": "https://open.spotify.com/episode/...",
    "deezerUrl": null,
    "appleUrl": null,
    "youtubeUrl": null
  }
]
```

## Références

```bash
curl "$BASE/api/references"
```

Réponse `200` :

```json
[
  {
    "id": 1,
    "nom": "Entreprise exemple",
    "type": "client",
    "logo": "/images/references/logo-x.png",
    "citation": "Une journée qui a soudé l'équipe.",
    "auteur": "Responsable RSE"
  }
]
```

## Réserver et payer (B2C)

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
  "montantCents": 9000,
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
  "montantCents": 9000,
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
    "experienceId": 1,
    "nbParticipants": 25,
    "dateSouhaitee": "2027-01-20",
    "message": "Nous cherchons un team building autour de l'\''alimentation durable."
  }'
```

**Devis pour l'offre podcast / studio**

```bash
curl -X POST "$BASE/api/devis" \
  -H "Content-Type: application/json" \
  -d '{
    "entreprise": "Marque Exemple",
    "contactNom": "Sophie Leroy",
    "email": "sophie@marque.fr",
    "typeDemande": "podcast_studio",
    "message": "Nous voulons lancer un podcast de marque."
  }'
```

Réponse `201` :

```json
{ "id": 3, "statut": "nouvelle" }
```

## Newsletter

```bash
curl -X POST "$BASE/api/newsletter" \
  -H "Content-Type: application/json" \
  -d '{ "email": "camille@example.com" }'
```

Réponse `201` : `{ "ok": true }`. E-mail déjà inscrit : `409`.
