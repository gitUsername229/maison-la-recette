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
| [docs/stripe.md](docs/stripe.md) | Paiement Stripe Checkout (sandbox) : installation, parcours et tests |

## Lancer le projet

Prérequis : Node.js 22.12 ou supérieur et npm.

```bash
git clone https://github.com/gitUsername229/maison-la-recette.git
cd maison-la-recette
npm install
cp .env.example .env.local      # puis remplir les clés (voir ci-dessous)
npx prisma migrate dev          # crée la base SQLite
npx prisma db seed              # données de démo + compte admin
npm run dev                     # http://localhost:3000
```

Sous PowerShell, utiliser `Copy-Item .env.example .env.local` à la place de `cp`.
Les commandes Prisma et Next.js chargent toutes deux le fichier `.env.local`.

Dans `.env.local`, avant le seed :
- `BETTER_AUTH_SECRET` : une longue chaîne aléatoire (`openssl rand -base64 32`), qui signe les sessions ;
- `ADMIN_EMAIL` et `ADMIN_PASSWORD` (8 caractères minimum) : le seed crée le compte admin avec ces identifiants.
  Ils ne sont jamais écrits dans le code ; le seed ne remplace pas le mot de passe d'un compte existant ;
- les clés Stripe sandbox pour tester le paiement (voir [docs/stripe.md](docs/stripe.md)).

Après un `git pull` qui ajoute une migration : `npx prisma migrate dev`, puis `npx prisma db seed`.
Tests automatiques : `npm test` (base SQLite jetable, n'utilise pas `dev.db`).

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

### État du projet

**En place :**
- Next.js, React, TypeScript, Tailwind, Prisma (SQLite) ; seed de trois expériences avec sessions et du compte admin.
- **Comptes** ([Better Auth](https://www.better-auth.com)) : inscription, connexion, déconnexion (`/inscription`, `/connexion`),
  mots de passe hachés en argon2id, session en cookie httpOnly. Rôles `client` et `admin`.
- **Site public sans compte** : accueil, `/experiences` et `/experiences/[slug]` (dates et places restantes),
  et les API publiques des contenus (épisodes, articles, avis, partenaires, galeries photos).
- **Réservation et paiement Stripe Checkout (sandbox)**, réservés aux comptes connectés
  (voir [docs/stripe.md](docs/stripe.md) et [docs/ateliers-stripe.md](docs/ateliers-stripe.md)).
- **Demande de devis** (`/contact`), réservée aux comptes connectés : nom, e-mail et téléphone repris du compte.
- **Espace `/compte`** : les réservations et les demandes de devis du client connecté, et uniquement les siennes.
- **Administration `/admin`** (rôle admin) : réservations, devis, expériences, sessions, photos (envoi de fichiers),
  épisodes, articles, avis, partenaires et utilisateurs. Le dernier compte admin ne peut être ni rétrogradé ni supprimé.

**Reste à faire :**
1. **E-mails** (Nodemailer + Mailpit) : confirmation au client après paiement, demande de devis envoyée à Julie,
   mot de passe oublié et vérification de l'adresse e-mail.
2. Pages publiques podcast, à propos et blog (les API qu'elles utiliseront sont prêtes).
3. Import des épisodes depuis le flux RSS Ausha (`POST /api/episodes/import`) et inscription à la newsletter.
4. Contenus réels (photos, textes, liens Ausha) : le seed n'en contient pas de fictifs.

**Améliorations futures** (pas urgentes, à faire en équipe) :
- **Prisma 7**, version stable actuelle (le projet est en 6.19, non dépréciée) : adaptateur SQLite
  (« driver adapter »), nouveau générateur `prisma-client` et imports du client à adapter partout.
- **Cache Components**, nouveau modèle de cache de Next.js 16 (optionnel) : activer `cacheComponents`
  et restructurer les pages (`Suspense`, `"use cache"`).
- **ESLint 10**, dès que la config ESLint de Next.js le supportera (ses plugins `react`, `import` et `jsx-a11y`
  s'arrêtent à ESLint 9, d'où l'avertissement `npm warn deprecated eslint@9` à l'installation).

> ⚠️ **Ne jamais lancer `npm audit fix --force`.** Les alertes de `npm audit` viennent d'outils de développement
> (CLI Prisma, plugin ESLint de Next), sans version corrigée disponible ; ce « correctif » rétrograderait
> `eslint-config-next` en v14 et `prisma` en 6.12 et casserait le projet.

### Sécurité des comptes

- Un seul contrôle d'accès, `verifierAcces` (`src/backend/auth/acces.ts`), utilisé par toutes les routes API
  (`401` non connecté, `403` rôle insuffisant) et par les pages `/compte`, `/contact` et `/admin` (redirection
  vers `/connexion` ou `/acces-refuse`). Il est appelé dans chaque page et route, pas seulement dans un layout.
- `/api/checkout` et `/api/devis` prennent le compte dans la session : un `userId` ou un e-mail envoyé par le front est refusé.
- Un client ne voit que ses propres réservations et demandes (`404` pour celles des autres).
- Le rôle ne se choisit pas à l'inscription ; seul un admin le modifie.
- Le header `x-admin-key` (`ADMIN_KEY`) remplace la session admin **en développement uniquement**,
  pour les tests curl ([docs/curl-admin.md](docs/curl-admin.md)) ; il est refusé en production (`npm start`).

Commandes complémentaires : `npm run lint`, `npm run typecheck`, `npm run build`
et `npm start` (après compilation).

Dans d'autres terminaux :

```bash
# Confirmations de paiement Stripe
stripe listen --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed --forward-to localhost:3000/api/webhook

# Boîte mail locale qui reçoit les e-mails de devis : http://localhost:8025
docker run --rm -p 8025:8025 -p 1025:1025 axllent/mailpit
```

Les épisodes du podcast se saisissent pour l'instant dans `/admin/episodes` ; l'import depuis le flux Ausha est prévu (voir « Reste à faire »).

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
| Comptes | **Better Auth** + argon2id (`@node-rs/argon2`) | Librairie reconnue : inscription, connexion, sessions en base et cookie httpOnly, sans authentification faite maison |
| Admin | **Interface `/admin` réservée au rôle admin** + clé `x-admin-key` pour les devs (développement uniquement) | Julie gère le site seule, sans toucher au code (voir plus bas) |

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
| Contact (`/contact`) | Demande de devis (B2B : expérience, sponsoring, studio, événement ; réponse sous 48h). Compte requis | B2B | `POST /api/devis` |
| Réservation (succès / annulée) | Confirmation après le paiement (succès : propriétaire de la réservation uniquement) | B2C | `GET /api/reservations?session_id=` |
| Connexion / Inscription | `/connexion` et `/inscription` ; un compte est requis pour réserver et demander un devis | Tous | `/api/auth/*` |
| Mon compte (`/compte`) | Mes réservations et mes demandes de devis | Clients | `GET /api/compte` |
| Admin (`/admin`) | Interface de gestion protégée par mot de passe (voir ci-dessous) | Julie | routes admin |

Chaque page peut afficher une galerie de photos : `GET /api/images?page=<chemin de la page>`.
Pas de logos clients : la crédibilité passe par les avis et les partenaires (affichés seulement après leur accord).

## Interface d'administration (`/admin`)

Julie gère le site seule et n'est pas technique : tout se fait avec des formulaires dans `/admin`.
L'accès est réservé aux comptes au rôle **admin** : Julie se connecte sur `/connexion` avec le compte créé par le seed
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`), puis le lien « Administration » apparaît dans l'en-tête. Elle peut donner le rôle
admin à un autre compte dans `/admin/utilisateurs`. Un client qui ouvre `/admin` est redirigé vers « Accès refusé ».

| Page admin | Ce que Julie peut y faire |
|---|---|
| `/admin/reservations` | Voir les réservations, les filtrer par statut, en annuler une |
| `/admin/devis` | Voir les demandes de devis, changer leur statut |
| `/admin/experiences` | Créer, modifier, masquer ou supprimer une expérience, choisir « réservable en ligne » ou « sur devis » |
| `/admin/sessions` | Ajouter des dates, modifier les places, fermer une session |
| `/admin/photos` | Envoyer des photos, choisir la page, le texte alternatif et l'ordre |
| `/admin/episodes` | Ajouter ou modifier un épisode : résumé, invité, liens (import Ausha à venir) |
| `/admin/articles` | Écrire, publier ou dépublier un article du blog |
| `/admin/avis` | Ajouter un avis client, l'afficher ou le masquer |
| `/admin/partenaires` | Ajouter un partenaire, l'afficher une fois son accord obtenu |
| `/admin/utilisateurs` | Voir les comptes, modifier un nom, un téléphone ou un rôle, supprimer un compte |

Toutes les rubriques utilisent la même page (`src/app/admin/[ressource]`), décrite dans `src/frontend/admin/ressources.ts` :
ajouter une rubrique revient à y décrire ses colonnes et ses champs. Les formulaires appellent les mêmes routes API
que les exemples de [docs/curl-admin.md](docs/curl-admin.md).

> En production, on recommandera un CMS (par exemple Strapi, Sanity ou Payload) : éditeur visuel, gestion des médias, plusieurs comptes. L'interface `/admin` couvre les besoins du projet.

## Variables d'environnement

`.env.example` (à copier en `.env.local`, qui n'est jamais commité) :

```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_BASE_URL=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

BETTER_AUTH_SECRET=remplacer-par-une-longue-chaine-aleatoire
ADMIN_EMAIL=admin@exemple.fr
ADMIN_PASSWORD=remplacer-par-un-mot-de-passe-solide
ADMIN_KEY=remplacer-par-une-cle-locale-aleatoire   # x-admin-key, développement uniquement
```

Prévues avec les e-mails et l'import Ausha : `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM`, `MAIL_DEVIS_TO`, `AUSHA_RSS_URL`.

Exclusions déjà configurées dans `.gitignore` :

```
.env
.env.local
prisma/dev.db
prisma/dev.db-journal
public/images/uploads/   (photos envoyées depuis /admin)
node_modules
.next
```
