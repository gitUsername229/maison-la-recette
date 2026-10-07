# Exemples curl : routes publiques

À faire avec le serveur lancé (`npm run dev`).

```bash
export BASE=http://localhost:3000
```

Tout le site s'utilise **sans compte** : réserver, demander un devis et s'inscrire à la newsletter sont ouverts
à tous. Seule l'équipe se connecte, pour l'administration (voir [curl-admin.md](curl-admin.md)).

Les trois formulaires publics (`/api/checkout`, `/api/devis`, `/api/newsletter`) demandent :
- `"consentement": true` (case « politique de confidentialité » cochée ; sa date est enregistrée). Absent ou `false` :
  `400` avec `{ "champ": "consentement", "message": "Cochez la case pour accepter la politique de confidentialité." }` ;
- de laisser vide le champ piège `siteWeb` (caché aux visiteurs). Rempli, on suppose un robot : le devis et la newsletter
  répondent comme d'habitude sans rien enregistrer ni envoyer, la réservation répond `400` ;
- de ne pas dépasser la limite d'envois par adresse IP (en production : 5 devis, 10 réservations et 5 inscriptions
  par 10 minutes ; 20 fois plus en développement). Au-delà : `429` avec
  `{ "error": "Trop d’envois en peu de temps depuis votre connexion. Réessayez dans 10 minutes." }`.

## Pas d'inscription

L'inscription est désactivée : la route de Better Auth répond `400`, et aucun compte n'est créé.

```bash
curl -X POST "$BASE/api/auth/sign-up/email" \
  -H "Content-Type: application/json" -H "Origin: $BASE" \
  -d '{ "name": "Camille Martin", "email": "camille@example.com", "password": "un-mot-de-passe" }'
```

Réponse `400` : `{ "code": "EMAIL_PASSWORD_SIGN_UP_DISABLED", "message": "Email and password sign up is not enabled" }`.

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

**Filtrer par type** (`complet`, `extrait` ou `replay` ; la page `/podcast` affiche les complets par défaut)

```bash
curl "$BASE/api/episodes?type=complet"
```

Type inconnu : `400`.

Réponse `200` :

```json
[
  {
    "id": 12,
    "saison": 2,
    "numero": 4,
    "titre": "Un chef contre le gaspillage",
    "resume": "Rencontre avec un chef qui cuisine les restes ...",
    "type": "complet",
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

**Les articles d'une catégorie** (page `/blog/categorie/guides`), éventuellement limités

```bash
curl "$BASE/api/articles?categorie=guides&limit=3"
```

Réponse `200` (extrait) :

```json
[
  {
    "id": 2,
    "slug": "cuisiner-les-epluchures",
    "titre": "Cuisiner les épluchures : 5 idées simples",
    "extrait": "Chips, bouillons, pestos : les épluchures ont de la ressource.",
    "image": "/images/blog/epluchures.jpg",
    "imageAlt": "Épluchures de légumes sur une planche",
    "categorie": "guides",
    "categorieLibelle": "Guides pratiques",
    "episodeId": null,
    "datePublication": "2026-10-01T08:00:00.000Z"
  }
]
```

Catégorie inconnue : `400` avec `{ "error": "Catégorie inconnue : retours-experience, coulisses-podcast, guides, entreprises." }`.

**Les catégories** (dans l'ordre des onglets du blog)

```bash
curl "$BASE/api/blog/categories"
```

Réponse `200` (extrait) : `[{ "valeur": "retours-experience", "libelle": "Retours d’expérience", "description": "…", "appelDevis": false }, …]`.
`appelDevis` vaut `true` pour « Pour les entreprises » : ses articles affichent l'encadré « Demander un devis ».

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
  "categorie": "guides",
  "categorieLibelle": "Guides pratiques",
  "episodeId": null,
  "datePublication": "2026-10-01T08:00:00.000Z"
}
```

La page `/blog/<adresse>` affiche en plus, sous l'article, l'épisode lié (« Écouter l'épisode »), les expériences liées
avec leurs 3 prochaines dates ouvertes (ou un lien vers toutes les expériences) et, pour « Pour les entreprises »,
l'encadré « Demander un devis ».

**Référencement**

```bash
curl "$BASE/sitemap.xml"
curl "$BASE/robots.txt"
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

## Textes des pages

**Textes d'une page** (`accueil`, `a-propos`, `studio`, `experiences`, `blog`, `confidentialite` ou `mentions-legales`),
dans l'ordre de la page

```bash
curl "$BASE/api/textes?page=studio"
```

Réponse `200` (extrait) :

```json
[
  {
    "id": 30, "page": "studio", "cle": "titre", "libelle": "Titre principal", "format": "titre",
    "facultatif": false, "longueurMax": 120, "texte": "Studio de production",
    "texteOrigine": "Studio de production", "modifie": false, "updatedAt": "2026-10-06T15:20:00.000Z"
  }
]
```

Page inconnue : `400` avec `{ "error": "Page inconnue : accueil, a-propos, studio, experiences, blog, confidentialite, mentions-legales." }`.
Chaque ligne a aussi un `apercu` (les 300 premiers caractères, pour la liste de l'admin). Le texte des pages
Confidentialité et Mentions légales (format `long`) garde ses retours à la ligne ; une ligne commençant par `## ` y est
un intertitre.
Les pages du site lisent ces textes directement côté serveur ; un texte absent de la base affiche son texte d'origine.

## Newsletter

**S'inscrire** (sans compte ; l'adresse est enregistrée en minuscules, sans espaces, avec la date du consentement)

```bash
curl -X POST "$BASE/api/newsletter" \
  -H "Content-Type: application/json" \
  -d '{ "email": "lectrice@example.com", "consentement": true }'
```

Réponse `201`, identique si l'adresse était déjà inscrite (on ne révèle pas qui est abonné) :

```json
{ "message": "Merci ! Votre adresse est inscrite à la newsletter." }
```

Adresse invalide : `400` avec `{ "champ": "email", "message": "Adresse e-mail invalide." }` dans `details`.
La liste des inscrits est réservée à l'admin (voir [curl-admin.md](curl-admin.md)).

## Réserver et payer (B2C)

Seulement pour les expériences réservables en ligne (`reservableEnLigne: true`). Sans compte : le nom, l'e-mail
(qui reçoit la confirmation) et le téléphone (facultatif) sont ceux saisis dans le formulaire.

**Créer la réservation et la session de paiement Stripe**

```bash
curl -X POST "$BASE/api/checkout" \
  -H "Idempotency-Key: 9e205ddd-e3a2-4a1b-81d6-8d505c126998" \
  -H "Content-Type: application/json" \
  -d '{ "sessionId": 4, "nbPersonnes": 2, "nom": "Camille Martin", "email": "camille@example.com", "telephone": "0600000000", "consentement": true }'
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

Remplacer l'UUID de l'exemple pour chaque nouvelle réservation. En cas de timeout,
réutiliser le même UUID et les mêmes données (même date, même nombre de places, même nom et même e-mail ; sinon `409`).
Les places sont bloquées tant que le paiement Checkout peut aboutir (35 min + 2 min de marge), puis libérées ;
voir [le guide](ateliers-stripe.md).

Erreurs possibles :

```json
{ "error": "Il ne reste que 1 place" }
```
(code `409`)

```json
{ "error": "Vérifiez les champs signalés.", "details": [{ "champ": "email", "message": "Adresse e-mail invalide." }] }
```
(code `400` : nom ou e-mail manquant, téléphone trop court, case de consentement non cochée…)

```json
{ "error": "Cette expérience se réserve sur devis" }
```
(code `400`)

**Retrouver la réservation après le paiement** (page `/reservation/succes?session_id=cs_test_...`)

Sans compte, c'est l'identifiant de session Stripe de l'adresse de retour qui donne accès à la réservation. Le serveur
interroge Stripe : la session doit exister et désigner cette réservation (`metadata.reservationId`). Sinon `404` ;
Stripe injoignable : `503`. La réponse ne contient ni nom, ni e-mail, ni téléphone.

```bash
curl "$BASE/api/reservations?session_id=cs_test_a1B2c3"
```

Réponse `200` :

```json
{
  "id": 7,
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

Si Stripe confirme un paiement que le webhook n'a pas encore signalé, il est enregistré à ce moment (une seule fois).

## Webhook Stripe

Cette route est appelée par Stripe, pas à la main : la signature du message est vérifiée. En local, on passe par la Stripe CLI.

```bash
# Terminal 1 : le site
npm run dev

# Terminal 2 : redirige les événements Stripe vers le site
stripe listen --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed --forward-to localhost:3000/api/webhook
# → affiche un secret "whsec_..." à copier dans .env.local (STRIPE_WEBHOOK_SECRET)

# Terminal 3 (optionnel) : simuler un paiement réussi sans passer par le navigateur
stripe trigger checkout.session.completed
```

Quand l'événement `checkout.session.completed` arrive : la réservation passe à `payee` et `placesPrises` augmente.

## Demande de devis (B2B)

Sans compte : `nom`, `entreprise`, `email` et `telephone` sont obligatoires (Julie rappelle avant de répondre).
`typeDemande` : `experience`, `sponsoring`, `studio` ou `evenement`. Seule une demande `experience` peut viser une
expérience (`experienceId`).

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
    "experienceId": 3,
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

La demande apparaît dans `/admin/devis`. Julie (`MAIL_ADMIN_TO`) reçoit le détail par e-mail (« répondre à » écrit
directement au client) et le client un accusé de réception qui récapitule sa demande (sa réponse arrive à Julie).
En local, les deux e-mails arrivent dans Mailpit : http://localhost:8025.

Téléphone ou e-mail manquant, champ inconnu (un ancien `userId` par exemple) : `400` avec les champs en cause dans `details`.
