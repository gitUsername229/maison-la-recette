# Maison La recette

Site web de la marque chapeau Maison La recette : podcast, expériences et studio.
Projet de workshop M1 (Groupe 3), 100 % local.

## Documentation

| Fichier | Contenu |
|---|---|
| [docs/base-de-donnees.md](docs/base-de-donnees.md) | Tables et colonnes de la base |
| [docs/api.md](docs/api.md) | Liste des routes API (GET / POST / admin) |
| [docs/curl-public.md](docs/curl-public.md) | Exemples curl des routes publiques |
| [docs/curl-admin.md](docs/curl-admin.md) | Exemples curl des routes admin |

## Lancer le projet

```bash
git clone https://github.com/gitUsername229/maison-la-recette.git
cd maison-la-recette
npm install
cp .env.example .env.local      # puis remplir les clés
npx prisma migrate dev          # crée la base SQLite
npx prisma db seed              # données de démo
npm run dev                     # http://localhost:3000
```

Dans un second terminal, pour les confirmations de paiement :

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

## Technologies utilisées

Tout tourne en local sur `http://localhost:3000`.

| Couche | Techno | Pourquoi |
|---|---|---|
| Front | **Next.js (React) + Tailwind CSS** | Un seul projet pour toutes les pages, rendu fidèle aux maquettes Figma |
| Back | **Routes API de Next.js** | Pas de serveur séparé : front et back se lancent avec `npm run dev` |
| Base de données | **SQLite + Prisma** | Un simple fichier, rien à installer, même structure pour toute l'équipe |
| Images | **Dossier `public/images/`** + chemins stockés en base | Pas d'hébergement externe, les images sont servies par Next.js |
| Paiement | **Stripe Checkout (sandbox)** | Paiement simulé, gratuit, carte de test `4242 4242 4242 4242` |
| Podcast | **Lecteur intégré Ausha** + table `Episode` | Les audios ne sont pas hébergés, seuls les liens et métadonnées sont en base |
| Admin | **Clé secrète dans un header** (`x-admin-key`) | Protection simple pour la démo |

## Pages du site

| Page | Contenu | Public visé | Routes utilisées |
|---|---|---|---|
| Accueil | Présentation de la marque chapeau et des 3 pôles, références, newsletter | Tous | `GET /api/references`, `GET /api/episodes?limit=3`, `POST /api/newsletter` |
| Podcast | Lecteur des épisodes, liens Spotify / Deezer / Apple / YouTube | Auditeurs | `GET /api/episodes` |
| Offre podcast | Studio de production pour d'autres marques | B2B | `POST /api/devis` |
| Expériences | Concept général | Tous | `GET /api/experiences` |
| Ateliers / Good tours / Immersions | 1 page par expérience, galerie photos, sessions réservables | B2C et B2B | `GET /api/experiences/[slug]`, `GET /api/sessions` |
| À propos | Mission, histoire, Julie Van Ossel, références | Tous | `GET /api/references` |
| Contact | Demande de devis (B2B) + réservation en ligne (B2C) | B2B / B2C | `POST /api/devis`, `POST /api/checkout` |
| Réservation (succès / annulée) | Confirmation après le paiement | B2C | `GET /api/reservations?session_id=` |
| Admin | Voir réservations et devis, gérer expériences, sessions, images | Julie | routes admin |

## Variables d'environnement

`.env.example` (à copier en `.env.local`) :

```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_BASE_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
ADMIN_KEY=ma-cle-secrete
```

À ajouter au `.gitignore` :

```
.env
.env.local
prisma/dev.db
prisma/dev.db-journal
node_modules
.next
```
