# Exemples curl : routes admin

Ces exemples sont pour les devs. Julie, elle, passe par l'interface `/admin`, dont les formulaires appellent ces mêmes routes.

Ces routes exigent un **compte admin connecté** (cookie de session). Les visiteurs n'ont pas de compte ; seule
l'équipe se connecte, sur `/admin/connexion`.

- sans session : `401` avec `{ "error": "Connectez-vous à l’administration pour continuer." }` ;
- connecté avec un compte sans le rôle admin : `403` avec `{ "error": "Accès réservé à l’administration." }`.

**Uniquement en développement** (`npm run dev`, tests), le header `x-admin-key` (valeur de `ADMIN_KEY`
dans `.env.local`) remplace la session admin pour ces exemples. Il est **refusé en production**
(`NODE_ENV=production`, donc avec `npm start`).

```bash
export BASE=http://localhost:3000
export ADMIN_KEY=ma-cle-secrete
```

## Admin : se connecter avec le compte admin

Le compte admin est créé par le seed à partir de `ADMIN_EMAIL` et `ADMIN_PASSWORD` (`.env.local`).
C'est ce que fait le formulaire de `/admin/connexion`. La session dure 30 jours, prolongée à chaque visite
(au plus une fois par jour).

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

**Session en cours** (`null` si personne n'est connecté ; la lire prolonge la session)

```bash
curl "$BASE/api/auth/get-session" -b admin.txt
```

**Se déconnecter**

```bash
curl -X POST "$BASE/api/auth/sign-out" -H "Origin: $BASE" -b admin.txt -c admin.txt
```

**Mot de passe oublié** (page `/admin/mot-de-passe-oublie` ; l'e-mail arrive dans Mailpit en local : http://localhost:8025)

```bash
curl -X POST "$BASE/api/auth/request-password-reset" \
  -H "Content-Type: application/json" -H "Origin: $BASE" \
  -d '{ "email": "admin@exemple.fr", "redirectTo": "/admin/reinitialiser-mot-de-passe" }'
```

Réponse `200` identique, que l'adresse ait un accès ou non. Le lien de l'e-mail mène à
`/admin/reinitialiser-mot-de-passe?token=…` (valable 1 h, usage unique), qui appelle :

```bash
curl -X POST "$BASE/api/auth/reset-password" \
  -H "Content-Type: application/json" -H "Origin: $BASE" \
  -d '{ "newPassword": "un-nouveau-mot-de-passe", "token": "JETON_DU_LIEN" }'
```

Les autres connexions sont fermées. Lien expiré ou déjà utilisé : `400` (`INVALID_TOKEN`).
Mauvais identifiants à la connexion : `401` avec `{ "code": "INVALID_EMAIL_OR_PASSWORD" }`.

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

Sans session admin (ni clé en développement) : `401`. Avec un compte sans le rôle admin : `403`.

## Admin : devis

**Voir toutes les demandes**

```bash
curl "$BASE/api/devis" -H "x-admin-key: $ADMIN_KEY"
```

**Filtrer les nouvelles demandes**

```bash
curl "$BASE/api/devis?statut=nouvelle" -H "x-admin-key: $ADMIN_KEY"
```

**Changer le statut et ajouter une note interne** (`statut` : `nouvelle`, `en_cours` ou `traitee` ; `noteInterne` n'est
jamais renvoyée au client, `null` l'efface)

```bash
curl -X PATCH "$BASE/api/devis/3" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "statut": "en_cours", "noteInterne": "Rappeler jeudi pour le budget" }'
```

**Supprimer une demande**

```bash
curl -X DELETE "$BASE/api/devis/3" -H "x-admin-key: $ADMIN_KEY"
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
    "titre": "Food tour : marché et producteurs",
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

**Masquer** (elle disparaît du site, ses sessions et réservations sont gardées ; `true` pour l'afficher de nouveau)

```bash
curl -X PUT "$BASE/api/experiences/1" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "actif": false }'
```

**Supprimer** (seulement si elle n'a aucune session ; sa couverture envoyée est effacée du disque)

```bash
curl -X DELETE "$BASE/api/experiences/1" -H "x-admin-key: $ADMIN_KEY"
```

Si elle a des sessions : `409`, avec la suggestion de la masquer.

```json
{
  "error": "Cette expérience a déjà 1 session : elle ne peut pas être supprimée, pour garder l’historique des dates et des réservations. Masquez-la : elle n’apparaîtra plus sur le site.",
  "suggestion": "masquer"
}
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

**Fermer la session** (plus personne ne peut réserver, les réservations faites sont gardées ; `"ouverte"` la rouvre)

```bash
curl -X PUT "$BASE/api/sessions/4" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "statut": "complete" }'
```

**Modifier le nombre de places** : il ne peut pas descendre sous les places déjà réservées (payées ou en cours de paiement).

```bash
curl -X PUT "$BASE/api/sessions/4" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "placesTotal": 1 }'
```

Réponse `409`, avec le champ à corriger :

```json
{
  "error": "2 places sont déjà réservées (payées ou en cours de paiement) : le nombre de places ne peut pas descendre sous 2.",
  "details": [{ "champ": "placesTotal", "message": "2 places sont déjà réservées (payées ou en cours de paiement) : le nombre de places ne peut pas descendre sous 2." }]
}
```

Tant qu'il y a des places réservées, la session ne peut pas non plus être déplacée (date, lieu) ni annulée.

**Supprimer** (seulement si elle n'a aucune réservation ; sinon `409` avec `"suggestion": "fermer"`)

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
    "embedUrl": "https://player.ausha.co/...",
    "audioUrl": "https://audio.ausha.co/....mp3"
  }'
```

`audioUrl` (facultatif) est le fichier lu par le lecteur sur mesure de `/podcast` ; l'import Ausha le remplit. Sans lui,
la page affiche le lecteur Ausha (`embedUrl`).

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

**Créer un article** (`"publie": false` pour un brouillon). `categorie` : `retours-experience`, `coulisses-podcast`,
`guides` (par défaut) ou `entreprises` ; `episodeId` et `experienceIds` sont facultatifs.

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
    "categorie": "guides",
    "episodeId": 12,
    "experienceIds": [1],
    "datePublication": "2026-10-01T08:00:00.000Z",
    "publie": true
  }'
```

Épisode ou expérience inexistant : `400`, avec le champ en cause (`episodeId` ou `experienceIds`). L'adresse `categorie`
est réservée aux pages de catégories (`400` sur `slug`).

**Voir tous les articles, brouillons compris** (avec `experienceIds` et le titre de l'épisode lié ; `?categorie=` pour filtrer)

```bash
curl "$BASE/api/articles?categorie=entreprises" -H "x-admin-key: $ADMIN_KEY"
```

**Changer les expériences liées** (la liste remplace les anciennes ; `[]` les retire toutes ; `"episodeId": null` délie l'épisode)

```bash
curl -X PUT "$BASE/api/articles/2" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "experienceIds": [1, 3], "episodeId": null }'
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

**Supprimer une photo de galerie** (le fichier est effacé s'il n'est plus utilisé ailleurs sur le site ; de même pour
une couverture ou une photo de partenaire remplacée ou supprimée)

```bash
curl -X DELETE "$BASE/api/images/2" -H "x-admin-key: $ADMIN_KEY"
```

## Admin : textes des pages

Les emplacements (titre, paragraphes, boutons de l'accueil, d'À propos, du studio, des expériences et du blog, texte
des pages Confidentialité et Mentions légales) sont fixés dans
`src/backend/contenus/textes-par-defaut.ts` : on modifie leur texte, on ne les crée ni ne les supprime.

**Voir les textes** (avec l'accès admin, les emplacements absents de la base y sont créés avec leur texte d'origine)

```bash
curl "$BASE/api/textes?page=accueil" -H "x-admin-key: $ADMIN_KEY"
```

**Modifier un texte** (seul champ accepté : `texte`)

```bash
curl -X PUT "$BASE/api/textes/2" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "texte": "Maison La recette, à La Rochelle" }'
```

Règles : un titre ou un bouton tient sur une ligne (les retours à la ligne deviennent des espaces), un paragraphe
et un texte de page (format `long`) gardent les leurs ; dans un texte de page, une ligne commençant par `## ` est un
intertitre. Longueur maximale : 120 caractères pour un titre, 1000 pour un paragraphe, 40 pour un bouton, 20 000 pour
un texte de page. Texte vide : `400` avec `{ "champ": "texte", "message": "Champ obligatoire." }` dans `details`, sauf
pour un texte facultatif (la mention en bas de l'accueil, le bandeau « texte à valider » des pages légales), qui
n'est alors plus affiché.

**Remettre le texte d'origine** : renvoyer `texteOrigine`, lu dans la liste.

## Admin : newsletter

**Voir les inscrits** (les plus récents d'abord)

```bash
curl "$BASE/api/newsletter" -H "x-admin-key: $ADMIN_KEY"
```

**Ajouter une adresse** (depuis l'admin : ni case de consentement, ni limite d'envois ; la date de consentement reste vide)

```bash
curl -X POST "$BASE/api/newsletter" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "email": "lectrice@example.com" }'
```

**Corriger une adresse**

```bash
curl -X PUT "$BASE/api/newsletter/4" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "email": "lectrice.bis@example.com" }'
```

Adresse déjà inscrite : `409` avec, sous le champ `email`, « Déjà utilisé par un autre élément : choisissez une autre valeur. ».

**Désinscrire une adresse**

```bash
curl -X DELETE "$BASE/api/newsletter/4" -H "x-admin-key: $ADMIN_KEY"
```

## Admin : administrateurs (`/admin/utilisateurs`)

**Lister les admins** (sans aucune donnée d'authentification ; `motDePasseChoisi` : `false` tant que l'admin ajouté
n'a pas utilisé le lien reçu par e-mail)

```bash
curl "$BASE/api/utilisateurs" -H "x-admin-key: $ADMIN_KEY"
```

Réponse `200` :

```json
[{ "id": "…", "nom": "Administration", "email": "admin@exemple.fr", "createdAt": "…", "motDePasseChoisi": true }]
```

**Ajouter un admin** (`nom`, `email`) : le compte est créé sans mot de passe, avec le rôle admin ; il reçoit un
e-mail avec un lien valable 1 h pour choisir le sien (ensuite : « Mot de passe oublié » sur `/admin/connexion`).

```bash
curl -X POST "$BASE/api/utilisateurs" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "nom": "Marc", "email": "marc@exemple.fr" }'
```

Réponse `201` : `{ "id": "…", "nom": "Marc", "email": "marc@exemple.fr" }`. Adresse déjà utilisée : `409` ;
un champ `role` (ou tout autre champ) est refusé : `400`.

**Retirer un admin** (ses connexions ouvertes sont fermées)

```bash
curl -X DELETE "$BASE/api/utilisateurs/ID_DU_COMPTE" -H "x-admin-key: $ADMIN_KEY"
```

Le **dernier admin** ne peut pas être supprimé, y compris par lui-même :
`409` avec `{ "error": "Impossible : c’est le dernier compte administrateur. Ajoutez d’abord un autre admin." }`.
