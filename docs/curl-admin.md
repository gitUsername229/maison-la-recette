# Exemples curl : routes admin

Toutes ces routes exigent le header `x-admin-key` (valeur de `ADMIN_KEY` dans `.env.local`). Sans lui : `401`.

```bash
export BASE=http://localhost:3000
export ADMIN_KEY=ma-cle-secrete
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
    "prixCents": 3500,
    "prixEntrepriseCents": 5000,
    "capaciteMax": 15,
    "lieu": "La Rochelle",
    "image": "/images/good-tours/cover.jpg",
    "imageAlt": "Groupe sur le marché",
    "actif": true
  }'
```

**Modifier** (envoyer les champs à changer)

```bash
curl -X PUT "$BASE/api/experiences/1" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "prixCents": 4800, "actif": true }'
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

**Ajouter l'image à la galerie d'une expérience**

```bash
curl -X POST "$BASE/api/images" \
  -H "x-admin-key: $ADMIN_KEY" \
  -F "file=@./photo-atelier.jpg" \
  -F "dossier=ateliers" \
  -F "experienceId=1" \
  -F "alt=Participants en pleine préparation" \
  -F "ordre=3"
```

**Supprimer une image de galerie**

```bash
curl -X DELETE "$BASE/api/images/2" -H "x-admin-key: $ADMIN_KEY"
```
