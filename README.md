# Maison La recette

Site web de la marque chapeau Maison La recette : podcast, expériences, studio et blog.
Projet de workshop M1 (Groupe 3), 100 % local.

## Documentation

| Fichier | Contenu |
|---|---|
| [docs/base-de-donnees.md](docs/base-de-donnees.md) | Tables et colonnes de la base |
| [docs/api.md](docs/api.md) | Liste des routes API (GET / POST / admin) |
| [docs/curl-public.md](docs/curl-public.md) | Exemples curl des routes publiques |
| [docs/curl-admin.md](docs/curl-admin.md) | Exemples curl des routes admin (pour les devs) |

## Lancer le projet

Prérequis : Node.js 22.12 ou supérieur et npm.

```bash
git clone https://github.com/gitUsername229/maison-la-recette.git
cd maison-la-recette
npm install
cp .env.example .env.local      # puis remplir les clés
npx prisma migrate dev          # crée la base SQLite
npx prisma db seed              # données de démo
npm run dev                     # http://localhost:3000
```

Sous PowerShell, utiliser `Copy-Item .env.example .env.local` à la place de `cp`.
Les commandes Prisma et Next.js chargent toutes deux le fichier `.env.local`.
Les clés Stripe peuvent être remplies lorsque le parcours de paiement sera développé.

## Séparation front / back

Le projet conserve **Next.js pour le front et les routes API**, avec un seul serveur
sur le port 3000. Le code est séparé par responsabilité :

```text
src/
  app/              Pages Next.js et points d'entrée /api
  frontend/         Pages de présentation, composants et styles Tailwind
  backend/          Accès Prisma, services, sécurité admin et intégration Stripe
prisma/             Schéma SQLite, migrations et données de démonstration
public/images/      Images locales
```

Les fichiers `src/app/page.tsx` et `src/app/api/**/route.ts` délèguent aux dossiers
front et back. Les modules sensibles du backend sont réservés au serveur avec
`server-only`; le frontend utilisera les routes `/api` pour accéder aux données.

### État de l'initialisation

Le socle comprend Next.js, React, TypeScript, Tailwind, les huit modèles Prisma,
un seed de trois expériences avec sessions, une page d'accueil provisoire et
`GET /api/health`. Les utilitaires Stripe sandbox et de contrôle `x-admin-key`
sont prêts pour les futures routes.

Les pages du site et les routes métier décrites ci-dessous et dans `docs/` sont
le périmètre à développer ; les paiements, le webhook, les formulaires et
l'administration ne sont pas encore implémentés. Le seed ne contient pas de
photos ni de liens Ausha fictifs : ajouter les contenus réels lors du développement.

Commandes complémentaires : `npm run lint`, `npm run typecheck`, `npm run build`
et `npm start` (après compilation).

Une fois le webhook implémenté, dans un second terminal pour les confirmations de paiement :
Dans d'autres terminaux :

```bash
# Confirmations de paiement Stripe
stripe listen --forward-to localhost:3000/api/webhook

# Boîte mail locale qui reçoit les e-mails de devis : http://localhost:8025
docker run --rm -p 8025:8025 -p 1025:1025 axllent/mailpit
```

Pour récupérer les épisodes du podcast : bouton « Importer depuis Ausha » dans `/admin/episodes` (ou `POST /api/episodes/import`, voir [docs/curl-admin.md](docs/curl-admin.md)).

## Principes du site

- **Français uniquement** : pas de traduction, `<html lang="fr">`, dates et prix au format français (`14 novembre 2026`, `70,00 €`).
- **Mobile d'abord** : chaque page est pensée pour le téléphone, puis élargie pour la tablette et l'ordinateur (préfixes Tailwind `md:` et `lg:`).
- **SEO de base** :
  - chaque page a un titre (`<title>`) et une meta description (via `metadata` de Next.js) ;
  - toutes les images ont un texte alternatif (`alt`), obligatoire en base (`imageAlt`, `photoAlt`, `alt`) ;
  - des URLs lisibles grâce aux slugs (`/experiences/atelier-cuisine-anti-gaspi`, `/blog/cuisiner-les-epluchures`).

## Technologies utilisées

Tout tourne en local sur `http://localhost:3000`.

| Couche | Techno | Pourquoi |
|---|---|---|
| Front | **Next.js (React) + Tailwind CSS** | Un seul projet pour toutes les pages, rendu fidèle aux maquettes Figma |
| Back | **Routes API de Next.js** | Pas de serveur séparé : front et back se lancent avec `npm run dev` |
| Base de données | **SQLite + Prisma** | Un simple fichier, rien à installer, même structure pour toute l'équipe |
| Images | **Dossier `public/images/`** + chemins stockés en base (table `Image` pour les galeries) | Pas d'hébergement externe, les images sont servies par Next.js |
| Paiement | **Stripe Checkout (sandbox)** | Paiement simulé, gratuit, carte de test `4242 4242 4242 4242`. Seulement pour les expériences réservables en ligne |
| E-mails | **Nodemailer + Mailpit** | Chaque demande de devis est envoyée par e-mail à Julie ; en local, Mailpit capture les e-mails sans rien envoyer |
| Podcast | **Flux RSS Ausha** importé dans la table `Episode` + lecteur intégré Ausha | Pas de double saisie : les audios restent chez Ausha, seuls les liens et métadonnées sont en base |
| Admin | **Interface `/admin` protégée par mot de passe** + clé `x-admin-key` pour les devs | Julie gère le site seule, sans toucher au code (voir plus bas) |

## Pages du site

| Page | Contenu | Public visé | Routes utilisées |
|---|---|---|---|
| Accueil | Présentation de la marque chapeau et des 3 pôles, avis clients, newsletter | Tous | `GET /api/avis`, `GET /api/episodes?limit=3`, `POST /api/newsletter` |
| Podcast | Épisodes par saison (résumé, lecteur Ausha), liens Spotify / Deezer / Apple / YouTube | Auditeurs | `GET /api/episodes` |
| Offre podcast | Studio de production pour d'autres marques, sponsoring du podcast | B2B | `POST /api/devis` |
| Expériences | Concept général | Tous | `GET /api/experiences` |
| Ateliers / Good tours / Immersions | 1 page par expérience, galerie photos. Ateliers et good tours : sessions réservables en ligne. Immersions (surtout B2B) : sur devis uniquement | B2C et B2B | `GET /api/experiences/[slug]`, `GET /api/sessions`, `POST /api/devis` |
| Blog (`/blog`) | Liste des articles publiés | Tous | `GET /api/articles` |
| Article (`/blog/[slug]`) | Un article complet | Tous | `GET /api/articles/[slug]` |
| À propos | Mission, histoire, Julie Van Ossel, partenaires, avis | Tous | `GET /api/partenaires`, `GET /api/avis` |
| Contact | Demande de devis (B2B : expérience, sponsoring, studio, événement ; réponse sous 48h) + réservation en ligne (B2C) | B2B / B2C | `POST /api/devis`, `POST /api/checkout` |
| Réservation (succès / annulée) | Confirmation après le paiement | B2C | `GET /api/reservations?session_id=` |
| Admin (`/admin`) | Interface de gestion protégée par mot de passe (voir ci-dessous) | Julie | routes admin |

Chaque page peut afficher une galerie de photos : `GET /api/images?page=<chemin de la page>`.
Pas de logos clients : la crédibilité passe par les avis et les partenaires (affichés seulement après leur accord).

## Interface d'administration (`/admin`)

Julie gère le site seule et n'est pas technique : tout se fait avec des formulaires dans `/admin`.
L'accès est protégé par un mot de passe (`ADMIN_PASSWORD`). Après connexion sur `/admin/connexion`, un cookie de session (httpOnly) la garde connectée.

| Page admin | Ce que Julie peut y faire |
|---|---|
| `/admin/reservations` | Voir les réservations, les filtrer par statut, en annuler une |
| `/admin/devis` | Voir les demandes de devis, changer leur statut |
| `/admin/experiences` | Créer, modifier, masquer ou supprimer une expérience, choisir « réservable en ligne » ou « sur devis » |
| `/admin/sessions` | Ajouter des dates, modifier les places, fermer une session |
| `/admin/photos` | Envoyer des photos, choisir la page, le texte alternatif et l'ordre |
| `/admin/episodes` | Importer les épisodes depuis Ausha, modifier le résumé, l'invité et les liens |
| `/admin/articles` | Écrire, publier ou dépublier un article du blog |
| `/admin/avis` | Ajouter un avis client, l'afficher ou le masquer |
| `/admin/partenaires` | Ajouter un partenaire, l'afficher une fois son accord obtenu |

Les formulaires appellent les mêmes routes API que les exemples de [docs/curl-admin.md](docs/curl-admin.md). Les curl (header `x-admin-key`) restent disponibles pour les devs.

> En production, on recommandera un CMS (par exemple Strapi, Sanity ou Payload) : éditeur visuel, gestion des médias, plusieurs comptes. L'interface `/admin` couvre les besoins du projet.

## Variables d'environnement

`.env.example` (à copier en `.env.local`) :

```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_BASE_URL=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

ADMIN_PASSWORD=mot-de-passe-de-julie
ADMIN_SESSION_SECRET=une-longue-chaine-aleatoire
ADMIN_KEY=ma-cle-secrete

SMTP_HOST=localhost
SMTP_PORT=1025
MAIL_FROM=site@maison-la-recette.local
MAIL_DEVIS_TO=julie@exemple.fr

AUSHA_RSS_URL=https://feed.ausha.co/xxxxxxxx
```

Exclusions déjà configurées dans `.gitignore` :

```
.env
.env.local
prisma/dev.db
prisma/dev.db-journal
node_modules
.next
```
