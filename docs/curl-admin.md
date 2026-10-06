# Exemples curl : routes admin

Ces exemples sont pour les devs. Julie, elle, passe par l'interface `/admin`, dont les formulaires appellent ces mêmes routes.

Toutes ces routes exigent le header `x-admin-key` (valeur de `ADMIN_KEY` dans `.env.local`) ou le cookie de session de l'interface `/admin`. Sans l'un ni l'autre : `401`.

```bash
export BASE=http://localhost:3000
export ADMIN_KEY=ma-cle-secrete
```

## Admin : connexion à l'interface

C'est ce que fait le formulaire de `/admin/connexion` (mot de passe : `ADMIN_PASSWORD` dans `.env.local`).

```bash
curl -X POST "$BASE/api/admin/connexion" \
  -H "Content-Type: application/json" \
  -d '{ "motDePasse": "mot-de-passe-de-julie" }' \
  -c cookies.txt
```

Réponse `200` : `{ "ok": true }` et un cookie `admin_session` (httpOnly). Mauvais mot de passe : `401`.

Le cookie remplace alors la clé :

```bash
curl "$BASE/api/devis" -b cookies.txt
```

**Se déconnecter**

```bash
curl -X POST "$BASE/api/admin/deconnexion" -b cookies.txt
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

Sans clé : `401` avec `{ "error": "Non autorisé" }`.

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
    "prixCents": null,
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

**Importer depuis le flux RSS Ausha** (bouton « Importer depuis Ausha » de `/admin/episodes`)

```bash
curl -X POST "$BASE/api/episodes/import" -H "x-admin-key: $ADMIN_KEY"
```

Réponse `200` :

```json
{ "crees": 2, "misAJour": 22 }
```

Le flux lu est `AUSHA_RSS_URL`. Les épisodes sont retrouvés par leur `guid` : relancer l'import ne crée pas de doublons et n'écrase pas les champs saisis dans l'admin (`resume`, `invite`, liens des plateformes).

**Modifier un épisode** (texte affiché sur le site, invité, liens)

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

Réponse `201` : `{ "id": 1, "visible": false }`.

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

## Admin : images

**Envoyer une image** (le fichier est enregistré dans `public/images/` et son chemin est renvoyé)

```bash
curl -X POST "$BASE/api/images" \
  -H "x-admin-key: $ADMIN_KEY" \
  -F "file=@./photo-atelier.jpg" \
  -F "dossier=ateliers"
```

Réponse `201` :

```json
{ "url": "/images/ateliers/photo-atelier.jpg" }
```

**Ajouter l'image à la galerie d'une page** (`page` = chemin de la page, `alt` obligatoire)

```bash
curl -X POST "$BASE/api/images" \
  -H "x-admin-key: $ADMIN_KEY" \
  -F "file=@./photo-atelier.jpg" \
  -F "dossier=ateliers" \
  -F "page=/experiences/atelier-cuisine-anti-gaspi" \
  -F "alt=Participants en pleine préparation" \
  -F "ordre=3"
```

Réponse `201` :

```json
{
  "id": 7,
  "url": "/images/ateliers/photo-atelier.jpg",
  "alt": "Participants en pleine préparation",
  "page": "/experiences/atelier-cuisine-anti-gaspi",
  "ordre": 3
}
```

Avec `page` mais sans `alt` : `400`.

**Modifier le texte alternatif ou l'ordre**

```bash
curl -X PUT "$BASE/api/images/7" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "alt": "Participants qui épluchent des légumes", "ordre": 1 }'
```

**Supprimer une image de galerie**

```bash
curl -X DELETE "$BASE/api/images/2" -H "x-admin-key: $ADMIN_KEY"
```
