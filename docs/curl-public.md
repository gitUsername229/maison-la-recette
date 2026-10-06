# Exemples curl : routes publiques

À faire avec le serveur lancé (`npm run dev`).

```bash
export BASE=http://localhost:3000
```

Tout le site se consulte sans compte. Un compte est obligatoire pour **réserver**, **demander un devis**
et consulter **son espace** : ces routes répondent `401` sans cookie de session.

## Comptes (Better Auth)

Les routes `/api/auth/*` sont fournies par Better Auth. Le cookie de session (`better-auth.session_token`,
httpOnly) est gardé dans `cookies.txt` puis renvoyé avec `-b cookies.txt`. Better Auth vérifie l'origine
des requêtes : ajouter `-H "Origin: $BASE"`.

**Créer un compte** (connecte aussitôt ; `telephone` facultatif ; mot de passe de 8 caractères minimum)

```bash
curl -X POST "$BASE/api/auth/sign-up/email" \
  -H "Content-Type: application/json" -H "Origin: $BASE" \
  -c cookies.txt \
  -d '{ "name": "Camille Martin", "email": "camille@example.com", "password": "un-mot-de-passe", "telephone": "0600000000" }'
```

Le rôle est toujours `client` : un champ `role` envoyé ici est ignoré. E-mail déjà utilisé : `422`.

**Se connecter**

```bash
curl -X POST "$BASE/api/auth/sign-in/email" \
  -H "Content-Type: application/json" -H "Origin: $BASE" \
  -c cookies.txt \
  -d '{ "email": "camille@example.com", "password": "un-mot-de-passe" }'
```

Mauvais identifiants : `401` avec `{ "code": "INVALID_EMAIL_OR_PASSWORD" }`.

**Mot de passe oublié** (l'e-mail arrive dans Mailpit en local : http://localhost:8025)

```bash
curl -X POST "$BASE/api/auth/request-password-reset" \
  -H "Content-Type: application/json" -H "Origin: $BASE" \
  -d '{ "email": "camille@example.com", "redirectTo": "/reinitialiser-mot-de-passe" }'
```

Réponse `200` identique, que l'adresse ait un compte ou non. Le lien de l'e-mail mène à
`/reinitialiser-mot-de-passe?token=…` (valable 1 h, usage unique), qui appelle :

```bash
curl -X POST "$BASE/api/auth/reset-password" \
  -H "Content-Type: application/json" -H "Origin: $BASE" \
  -d '{ "newPassword": "un-nouveau-mot-de-passe", "token": "JETON_DU_LIEN" }'
```

Les autres connexions du compte sont fermées. Lien expiré ou déjà utilisé : `400` (`INVALID_TOKEN`).

**Vérification de l'adresse** : un lien est envoyé à l'inscription (valable 24 h). Pour le renvoyer :

```bash
curl -X POST "$BASE/api/auth/send-verification-email" \
  -H "Content-Type: application/json" -H "Origin: $BASE" \
  -d '{ "email": "camille@example.com", "callbackURL": "/compte" }'
```

**Session en cours** (`null` si personne n'est connecté)

```bash
curl "$BASE/api/auth/get-session" -b cookies.txt
```

**Se déconnecter**

```bash
curl -X POST "$BASE/api/auth/sign-out" -H "Origin: $BASE" -b cookies.txt -c cookies.txt
```

**Mon espace** : le compte, ses réservations et ses demandes de devis (jamais celles d'un autre client)

```bash
curl "$BASE/api/compte" -b cookies.txt
```

Réponse `200` :

```json
{
  "utilisateur": { "id": "…", "nom": "Camille Martin", "email": "camille@example.com", "telephone": "0600000000", "role": "client" },
  "reservations": [{ "id": 7, "nbPersonnes": 2, "montantCents": 9000, "statut": "payee", "session": { "dateDebut": "…", "lieu": "La Rochelle", "experience": { "titre": "…", "slug": "…" } } }],
  "demandesDevis": [{ "id": 3, "typeDemande": "studio", "entreprise": "Marque Exemple", "statut": "nouvelle" }]
}
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

## Textes des pages

**Textes d'une page** (`accueil`, `a-propos` ou `studio`), dans l'ordre de la page

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

Page inconnue : `400` avec `{ "error": "Page inconnue : accueil, a-propos ou studio." }`.
Les pages du site lisent ces textes directement côté serveur ; un texte absent de la base affiche son texte d'origine.

## Newsletter

**S'inscrire** (sans compte ; l'adresse est enregistrée en minuscules, sans espaces)

```bash
curl -X POST "$BASE/api/newsletter" \
  -H "Content-Type: application/json" \
  -d '{ "email": "lectrice@example.com" }'
```

Réponse `201`, identique si l'adresse était déjà inscrite (on ne révèle pas qui est abonné) :

```json
{ "message": "Merci ! Votre adresse est inscrite à la newsletter." }
```

Adresse invalide : `400` avec `{ "champ": "email", "message": "Adresse e-mail invalide." }` dans `details`.
La liste des inscrits est réservée à l'admin (voir [curl-admin.md](curl-admin.md)).

## Réserver et payer (B2C)

Seulement pour les expériences réservables en ligne (`reservableEnLigne: true`), avec un compte connecté.
Le nom, l'e-mail et le téléphone de la réservation sont ceux du compte : ils ne s'envoient pas.

**Créer la réservation et la session de paiement Stripe**

```bash
curl -X POST "$BASE/api/checkout" \
  -b cookies.txt \
  -H "Idempotency-Key: 9e205ddd-e3a2-4a1b-81d6-8d505c126998" \
  -H "Content-Type: application/json" \
  -d '{ "sessionId": 4, "nbPersonnes": 2 }'
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
réutiliser le même UUID et les mêmes données. Les places sont bloquées tant que le
paiement Checkout peut aboutir (35 min + 2 min de marge), puis libérées ; voir [le guide](ateliers-stripe.md).

Erreurs possibles :

```json
{ "error": "Connectez-vous pour continuer." }
```
(code `401`, sans cookie de session)

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

Réservé au compte qui a réservé (ou à un admin) : sans cookie `401`, avec le compte d'un autre client `404`.

```bash
curl "$BASE/api/reservations?session_id=cs_test_a1B2c3" -b cookies.txt
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
stripe listen --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed --forward-to localhost:3000/api/webhook
# → affiche un secret "whsec_..." à copier dans .env.local (STRIPE_WEBHOOK_SECRET)

# Terminal 3 (optionnel) : simuler un paiement réussi sans passer par le navigateur
stripe trigger checkout.session.completed
```

Quand l'événement `checkout.session.completed` arrive : la réservation passe à `payee` et `placesPrises` augmente.

## Demande de devis (B2B)

Avec un compte connecté. `contactNom`, `email` et `telephone` sont repris du compte : ils ne s'envoient pas
(un `userId` ou un `email` envoyé est refusé, `400`). Si le compte n'a pas de téléphone, envoyer `telephone` :
il est obligatoire (Julie rappelle d'abord) et complète le compte.

`typeDemande` : `experience`, `sponsoring`, `studio` ou `evenement`. Seule une demande `experience` peut viser une expérience (`experienceId`).

**Devis pour une expérience en entreprise**

```bash
curl -X POST "$BASE/api/devis" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "entreprise": "Entreprise Exemple",
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
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "entreprise": "Marque Exemple",
    "typeDemande": "studio",
    "message": "Nous voulons lancer un podcast de marque."
  }'
```

Les demandes `sponsoring` (sponsoriser le podcast) et `evenement` s'envoient de la même façon.

Réponse `201` :

```json
{ "id": 3, "statut": "nouvelle" }
```

La demande apparaît dans `/admin/devis` et dans l'espace `/compte` du client. Julie (`MAIL_ADMIN_TO`) reçoit le
détail par e-mail (« répondre à » écrit directement au client) et le client un accusé de réception. En local, les
deux e-mails arrivent dans Mailpit : http://localhost:8025.

Sans cookie : `401`. Compte sans téléphone et `telephone` absent : `400` avec
`{ "error": "Indiquez un numéro de téléphone : Julie vous rappelle avant de répondre." }`.
