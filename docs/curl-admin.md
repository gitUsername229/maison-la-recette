# Exemples curl : routes admin

Ces exemples sont pour les devs. Julie, elle, passe par l'interface `/admin`, dont les formulaires appellent ces mêmes routes.

Ces routes exigent un **compte admin connecté** (cookie de session) :

- sans session : `401` avec `{ "error": "Connectez-vous pour continuer." }` ;
- connecté avec un compte client : `403` avec `{ "error": "Accès réservé à l’administration." }`.

**Uniquement en développement** (`npm run dev`, tests), le header `x-admin-key` (valeur de `ADMIN_KEY`
dans `.env.local`) remplace la session admin pour ces exemples. Il est **refusé en production**
(`NODE_ENV=production`, donc avec `npm start`) et ne permet jamais de réserver ni de demander un devis.

```bash
export BASE=http://localhost:3000
export ADMIN_KEY=ma-cle-secrete
```

## Admin : se connecter avec le compte admin

Le compte admin est créé par le seed à partir de `ADMIN_EMAIL` et `ADMIN_PASSWORD` (`.env.local`).
C'est ce que fait le formulaire de `/connexion`.

```bash
curl -X POST "$BASE/api/auth/sign-in/email" \
  -H "Content-Type: application/json" -H "Origin: $BASE" \
  -c admin.txt \
  -d '{ "email": "admin@exemple.fr", "password": "mot-de-passe-admin" }'
```

Le cookie remplace alors la clé dans tous les exemples ci-dessous :

```bash
curl "$BASE/api/devis" -b admin.txt
```

**Se déconnecter**

```bash
curl -X POST "$BASE/api/auth/sign-out" -H "Origin: $BASE" -b admin.txt -c admin.txt
```

## Admin : réservations

**Voir toutes les réservations**

```bash
curl "$BASE/api/reservations" -H "x-admin-key: $ADMIN_KEY"
```

**Filtrer par statut**

```bash
curl "$BASE/api/reservations?statut=payee" -H "x-admin-key: $ADMIN_KEY"
```

**Annuler une réservation**

Une réservation en attente est d'abord expirée dans Stripe. Pour une réservation
payée, effectuer le remboursement intégral dans Stripe avant ce PATCH ; sinon la
route répond `409`. Un remboursement partiel ne suffit pas.

```bash
curl -X PATCH "$BASE/api/reservations/7" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "statut": "annulee" }'
```

Sans session admin (ni clé en développement) : `401`. Avec un compte client : `403`.

## Admin : devis

**Voir toutes les demandes**

```bash
curl "$BASE/api/devis" -H "x-admin-key: $ADMIN_KEY"
```

**Filtrer les nouvelles demandes**

```bash
curl "$BASE/api/devis?statut=nouvelle" -H "x-admin-key: $ADMIN_KEY"
```

**Changer le statut**

```bash
curl -X PATCH "$BASE/api/devis/3" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "statut": "traitee" }'
```

## Admin : gérer les expériences

**Créer**

```bash
curl -X POST "$BASE/api/experiences" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "good-tour-marche-producteurs",
    "type": "good_tour",
    "titre": "Good tour : marché et producteurs",
    "accroche": "À la rencontre de celles et ceux qui nous nourrissent",
    "description": "Une balade gourmande ...",
    "dureeMin": 180,
    "prixCents": 6000,
    "prixEntrepriseCents": 8000,
    "reservableEnLigne": true,
    "capaciteMax": 15,
    "lieu": "La Rochelle",
    "image": "/images/good-tours/cover.jpg",
    "imageAlt": "Groupe sur le marché",
    "actif": true
  }'
```

**Créer une immersion** (surtout B2B : sur devis uniquement, pas de paiement en ligne)

```bash
curl -X POST "$BASE/api/experiences" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "immersion-ferme-maraichere",
    "type": "immersion",
    "titre": "Immersion chez une maraîchère",
    "accroche": "Une journée les mains dans la terre avec votre équipe",
    "description": "Une journée complète ...",
    "dureeMin": 420,
    "prixCents": 6500,
    "reservableEnLigne": false,
    "capaciteMax": 30,
    "image": "/images/immersions/cover.jpg",
    "imageAlt": "Équipe en train de récolter des légumes",
    "actif": true
  }'
```

**Modifier** (envoyer les champs à changer)

```bash
curl -X PUT "$BASE/api/experiences/1" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "prixCents": 7500, "actif": true }'
```

**Supprimer**

```bash
curl -X DELETE "$BASE/api/experiences/1" -H "x-admin-key: $ADMIN_KEY"
```

## Admin : gérer les sessions

**Créer une session**

```bash
curl -X POST "$BASE/api/sessions" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "experienceId": 1,
    "dateDebut": "2026-12-05T10:00:00.000Z",
    "dateFin": "2026-12-05T12:30:00.000Z",
    "lieu": "La Rochelle",
    "placesTotal": 12
  }'
```

**Modifier** (par exemple fermer la session)

```bash
curl -X PUT "$BASE/api/sessions/4" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "statut": "complete" }'
```

**Supprimer**

```bash
curl -X DELETE "$BASE/api/sessions/4" -H "x-admin-key: $ADMIN_KEY"
```

## Admin : épisodes du podcast

**Ajouter un épisode à la main** (`saison` vaut `1` par défaut, `resume` est facultatif)

```bash
curl -X POST "$BASE/api/episodes" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "saison": 1,
    "numero": 12,
    "titre": "Cuisiner les restes avec un chef",
    "description": "Description complète de l'\''épisode ...",
    "datePublication": "2026-10-01",
    "dureeMin": 42,
    "image": "https://image.ausha.co/...",
    "embedUrl": "https://player.ausha.co/..."
  }'
```

**Importer depuis le flux RSS Ausha** (bouton « Importer depuis Ausha » de `/admin/episodes`)

```bash
curl -X POST "$BASE/api/episodes/import" -H "x-admin-key: $ADMIN_KEY"
```

Réponse `200` :

```json
{ "crees": 0, "misAJour": 101, "message": "Import terminé : 0 épisode(s) ajouté(s), 101 mis à jour." }
```

Le flux lu est `AUSHA_RSS_URL`. Les épisodes sont retrouvés par leur `guid` : relancer l'import ne crée pas de
doublon et n'écrase pas le `type`, le `resume`, l'`invite` ni les liens saisis dans l'admin. À la création, le
type est déduit du titre (`REPLAY`/`REDIFFUSION` → `replay`, `EXTRAIT`/`TEASER` et bande-annonce → `extrait`,
sinon `complet`) et le résumé s'arrête avant le texte commun de fin (crédits, soutien, réseaux).
Flux non configuré : `503` ; flux injoignable : `502`.

**Modifier un épisode** (type `complet` / `extrait` / `replay`, texte affiché sur le site, invité, liens)

```bash
curl -X PUT "$BASE/api/episodes/12" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resume": "Rencontre avec un chef qui cuisine les restes ...",
    "invite": "Nom du chef",
    "spotifyUrl": "https://open.spotify.com/episode/..."
  }'
```

## Admin : blog

**Créer un article** (`"publie": false` pour un brouillon)

```bash
curl -X POST "$BASE/api/articles" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "cuisiner-les-epluchures",
    "titre": "Cuisiner les épluchures : 5 idées simples",
    "extrait": "Chips, bouillons, pestos : les épluchures ont de la ressource.",
    "contenu": "## 1. Des chips d'\''épluchures\n\n...",
    "image": "/images/blog/epluchures.jpg",
    "imageAlt": "Épluchures de légumes sur une planche",
    "datePublication": "2026-10-01T08:00:00.000Z",
    "publie": true
  }'
```

**Voir tous les articles, brouillons compris**

```bash
curl "$BASE/api/articles" -H "x-admin-key: $ADMIN_KEY"
```

**Modifier** (par exemple dépublier)

```bash
curl -X PUT "$BASE/api/articles/2" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "publie": false }'
```

**Supprimer**

```bash
curl -X DELETE "$BASE/api/articles/2" -H "x-admin-key: $ADMIN_KEY"
```

## Admin : avis

**Ajouter un avis** (`note` sur 5, optionnelle)

```bash
curl -X POST "$BASE/api/avis" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Claire D.",
    "citation": "Une journée qui a soudé l'\''équipe.",
    "contexte": "Team building, atelier anti-gaspi",
    "note": 5,
    "visible": true
  }'
```

**Masquer un avis**

```bash
curl -X PUT "$BASE/api/avis/1" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "visible": false }'
```

**Supprimer**

```bash
curl -X DELETE "$BASE/api/avis/1" -H "x-admin-key: $ADMIN_KEY"
```

## Admin : partenaires

**Ajouter un partenaire** (masqué par défaut, en attendant son accord)

```bash
curl -X POST "$BASE/api/partenaires" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Nom de la maraîchère",
    "metier": "Maraîchère",
    "photo": "/images/partenaires/maraichere.jpg",
    "photoAlt": "La maraîchère dans ses serres",
    "description": "Légumes de saison cultivés à ..."
  }'
```

Réponse `201` : le partenaire créé, avec `"visible": false`.

**L'afficher une fois son accord obtenu**

```bash
curl -X PUT "$BASE/api/partenaires/1" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "visible": true }'
```

**Supprimer**

```bash
curl -X DELETE "$BASE/api/partenaires/1" -H "x-admin-key: $ADMIN_KEY"
```

## Admin : photos (galeries)

**1. Envoyer le fichier** (JPG, PNG ou WebP, 5 Mo maximum). Le type est vérifié sur le contenu du fichier,
qui est enregistré sous un nom aléatoire dans `public/images/uploads/` (ignoré par git).

```bash
curl -X POST "$BASE/api/images/fichier" \
  -H "x-admin-key: $ADMIN_KEY" \
  -F "fichier=@./photo-atelier.jpg"
```

Réponse `201` :

```json
{ "url": "/images/uploads/3f1c…e9.jpg" }
```

Ce chemin sert aussi pour la couverture d'une expérience ou d'un article (`image`) et la photo d'un partenaire (`photo`).
Fichier d'un autre type : `400` avec `{ "error": "Format non accepté : JPG, PNG ou WebP uniquement" }`.

**2. L'ajouter à la galerie d'une page** (`page` = chemin de la page, `alt` obligatoire, `ordre` facultatif)

```bash
curl -X POST "$BASE/api/images" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "/images/uploads/3f1c…e9.jpg",
    "alt": "Participants en pleine préparation",
    "page": "/experiences/atelier-cuisine-anti-gaspi",
    "ordre": 3
  }'
```

Réponse `201` : la photo créée (`id`, `url`, `alt`, `page`, `ordre`). Sans `alt` : `400`.

**Modifier le texte alternatif ou l'ordre**

```bash
curl -X PUT "$BASE/api/images/7" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "alt": "Participants qui épluchent des légumes", "ordre": 1 }'
```

**Supprimer une photo de galerie** (le fichier est effacé s'il n'est plus utilisé ailleurs sur le site)

```bash
curl -X DELETE "$BASE/api/images/2" -H "x-admin-key: $ADMIN_KEY"
```

## Admin : utilisateurs

**Lister les comptes** (sans aucune donnée d'authentification ; nombre de réservations et de devis inclus)

```bash
curl "$BASE/api/utilisateurs" -H "x-admin-key: $ADMIN_KEY"
```

**Modifier un compte** (`nom`, `telephone` ou `role` : `client` ou `admin`)

```bash
curl -X PATCH "$BASE/api/utilisateurs/ID_DU_COMPTE" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "role": "admin" }'
```

**Supprimer un compte** (ses réservations et demandes de devis sont conservées, détachées du compte)

```bash
curl -X DELETE "$BASE/api/utilisateurs/ID_DU_COMPTE" -H "x-admin-key: $ADMIN_KEY"
```

Le **dernier compte admin** ne peut être ni rétrogradé en `client` ni supprimé, y compris par lui-même :
`409` avec `{ "error": "Impossible : c’est le dernier compte administrateur. Donnez d’abord le rôle admin à un autre compte." }`.
