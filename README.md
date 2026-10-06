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
npx prisma db seed              # données de démo, compte admin, textes des pages
npm run dev                     # http://localhost:3000
```

Sous PowerShell, utiliser `Copy-Item .env.example .env.local` à la place de `cp`.
Les commandes Prisma et Next.js chargent toutes deux le fichier `.env.local`.

Dans `.env.local`, avant le seed :
- `BETTER_AUTH_SECRET` : une longue chaîne aléatoire (`openssl rand -base64 32`), qui signe les sessions ;
- `ADMIN_EMAIL` et `ADMIN_PASSWORD` (8 caractères minimum) : le seed crée le compte admin avec ces identifiants.
  Ils ne sont jamais écrits dans le code ; le seed ne remplace pas le mot de passe d'un compte existant ;
- les clés Stripe sandbox pour tester le paiement (voir [docs/stripe.md](docs/stripe.md)) ;
- les e-mails : `SMTP_HOST`/`SMTP_PORT` (Mailpit en local, voir plus bas) et `MAIL_ADMIN_TO`, la boîte de Julie
  qui reçoit les devis et les réservations (**adresse fictive en démo**, ex : `julie@exemple.fr`).

Après un `git pull` qui ajoute une migration : `npx prisma migrate dev`, puis `npx prisma db seed`, puis
**redémarrer `npm run dev`** (sinon le serveur garde l'ancien client Prisma et répond « Un problème technique est survenu »).
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
- Next.js, React, TypeScript, Tailwind, Prisma (SQLite) ; seed de trois expériences avec sessions, du compte admin
  et des textes des pages (textes d'origine).
- **Comptes** ([Better Auth](https://www.better-auth.com)) : inscription, connexion, déconnexion (`/inscription`, `/connexion`),
  mots de passe hachés en argon2id, session en cookie httpOnly. Rôles `client` et `admin`.
- **Site public sans compte**, alimenté par l'admin (un changement apparaît aussitôt) : accueil (avis, galerie,
  newsletter), `/experiences` et `/experiences/[slug]` (couverture, galerie, dates et places restantes),
  `/a-propos` (partenaires, avis, galerie), `/blog` et `/blog/[slug]` (articles mis en forme en Markdown), `/podcast`.
- **Réservation et paiement Stripe Checkout (sandbox)**, réservés aux comptes connectés
  (voir [docs/stripe.md](docs/stripe.md) et [docs/ateliers-stripe.md](docs/ateliers-stripe.md)).
- **Demande de devis** (`/contact`), réservée aux comptes connectés : nom, e-mail et téléphone repris du compte.
- **Espace `/compte`** : les réservations et les demandes de devis du client connecté, et uniquement les siennes.
- **Administration `/admin`** (rôle admin) : Julie gère tout le site seule (voir plus bas), avec des règles qui
  protègent l'historique : on masque une expérience, on ferme une session, on annule une réservation.
- **Newsletter** : inscription sur l'accueil (sans compte), liste des inscrits dans `/admin/newsletter`.
- **E-mails** (Nodemailer, Mailpit en local) : confirmation de réservation au client et information à Julie
  (une seule fois par paiement), demande de devis à Julie et accusé de réception au client, mot de passe oublié
  (`/mot-de-passe-oublie`) et vérification de l'adresse à l'inscription (non bloquante, rappel dans `/compte`).
  Envoyés après la réponse ; un échec est journalisé sans rien annuler (`src/backend/mails/`).
- **Podcast** (`/podcast`) : les 101 épisodes de « la recette » importés depuis le flux Ausha (bouton dans
  `/admin/episodes`), classés en épisodes complets (affichés par défaut), extraits et replays, groupés par saison,
  avec lecteur Ausha et liens d'écoute de l'émission (`src/backend/podcast/emission.ts`).
- **Places** : un paiement Stripe expiré ne bloque plus de place, même si l'événement d'expiration n'arrive jamais.

**Reste à faire :**
1. Contenus réels (photos, articles, avis, partenaires, textes des pages) : Julie les saisit dans `/admin` ; le seed
   ne contient pas de contenus fictifs. Les épisodes, eux, viennent d'Ausha.

**Améliorations futures** (pas urgentes, à faire en équipe) :
- **Prisma 7**, version stable actuelle (le projet est en 6.19, non dépréciée) : adaptateur SQLite
  (« driver adapter »), nouveau générateur `prisma-client` et imports du client à adapter partout.
- **Cache Components**, nouveau modèle de cache de Next.js 16 (optionnel) : activer `cacheComponents`
  et restructurer les pages (`Suspense`, `"use cache"`).
- **Renvoyer un e-mail** depuis l'admin (ex : « Renvoyer la confirmation » dans `/admin/reservations`) ;
  aujourd'hui un envoi échoué est seulement journalisé.
- **Newsletter** : confirmation de l'inscription par e-mail (double opt-in), lien de désinscription et export
  des adresses vers l'outil d'envoi (Brevo, Mailchimp…). Aujourd'hui, les adresses sont seulement enregistrées.
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
- Mot de passe oublié : même réponse qu'un compte existe ou non (aucune adresse révélée), lien valable 1 h
  et à usage unique, autres connexions fermées après le changement.
- Les e-mails échappent tout texte saisi (nom, message) : impossible d'y injecter du HTML.
- Le header `x-admin-key` (`ADMIN_KEY`) remplace la session admin **en développement uniquement**,
  pour les tests curl ([docs/curl-admin.md](docs/curl-admin.md)) ; il est refusé en production (`npm start`).

Commandes complémentaires : `npm run lint`, `npm run typecheck`, `npm run build`
et `npm start` (après compilation).

Dans d'autres terminaux :

```bash
# Confirmations de paiement Stripe
stripe listen --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed --forward-to localhost:3000/api/webhook

# Boîte mail locale (Mailpit) : tous les e-mails du site arrivent sur http://localhost:8025, rien ne part réellement
docker run --rm -p 8025:8025 -p 1025:1025 axllent/mailpit
```

Pour récupérer les épisodes du podcast : bouton « Importer depuis Ausha » dans `/admin/episodes` (ou `POST /api/episodes/import`,
voir [docs/curl-admin.md](docs/curl-admin.md)). L'import est rejouable : il ajoute les nouveaux épisodes et met à jour les autres
sans écraser le type, le résumé, l'invité ni les liens modifiés dans l'admin.

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
| E-mails | **Nodemailer + Mailpit** | Réservations, devis, mot de passe oublié, vérification d'adresse ; en local, Mailpit capture les e-mails sans rien envoyer. En production, il suffit de changer `SMTP_*` |
| Podcast | **Flux RSS Ausha** importé dans la table `Episode` + lecteur intégré Ausha | Pas de double saisie : les audios restent chez Ausha, seuls les liens et métadonnées sont en base |
| Comptes | **Better Auth** + argon2id (`@node-rs/argon2`) | Librairie reconnue : inscription, connexion, sessions en base et cookie httpOnly, sans authentification faite maison |
| Admin | **Interface `/admin` réservée au rôle admin** + clé `x-admin-key` pour les devs (développement uniquement) | Julie gère le site seule, sans toucher au code (voir plus bas) |

## Pages du site

| Page | Contenu | Public visé | Routes utilisées |
|---|---|---|---|
| Accueil | Présentation de la marque chapeau et des 3 pôles, avis clients, galerie photos, inscription à la newsletter | Tous | `GET /api/avis`, `GET /api/images?page=/`, `POST /api/newsletter` |
| Podcast (`/podcast`) | Épisodes par saison (résumé, lecteur Ausha), complets par défaut, filtre extraits / replays, liens de l'émission (smartlink, Apple Podcasts, Spotify, Deezer, YouTube) | Auditeurs | `GET /api/episodes?type=` |
| Offre podcast | Studio de production pour d'autres marques, sponsoring du podcast | B2B | `POST /api/devis` |
| Expériences | Concept général | Tous | `GET /api/experiences` |
| Ateliers / Good tours / Immersions | 1 page par expérience, galerie photos. Ateliers et good tours : sessions réservables en ligne. Immersions (surtout B2B) : sur devis uniquement | B2C et B2B | `GET /api/experiences/[slug]`, `GET /api/sessions`, `POST /api/devis` |
| Blog (`/blog`) | Liste des articles publiés | Tous | `GET /api/articles` |
| Article (`/blog/[slug]`) | Un article complet, mis en forme en Markdown (intertitres, gras, listes, liens) | Tous | `GET /api/articles/[slug]` |
| À propos | Mission, histoire, Julie Van Ossel, partenaires, avis, galerie photos | Tous | `GET /api/partenaires`, `GET /api/avis` |
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
| `/admin/reservations` | Voir la liste et la fiche d'une réservation, filtrer par statut, l'annuler. Jamais de suppression (historique, comptabilité) |
| `/admin/devis` | Voir la fiche d'une demande, changer son statut, ajouter une note interne (jamais vue par le client), la supprimer |
| `/admin/experiences` | Créer, modifier, masquer ou afficher une expérience, choisir « réservable en ligne » ou « sur devis ». Une expérience qui a des sessions ne se supprime pas : l'admin propose de la masquer |
| `/admin/sessions` | Ajouter des dates, les modifier, fermer ou rouvrir une session. Une session réservée ne se supprime pas (l'admin propose de la fermer) et ses places ne descendent pas sous les places réservées |
| `/admin/textes` | Modifier les titres, paragraphes et boutons de l'accueil, d'« À propos » et du studio (filtre par page), ou remettre le texte d'origine. Les liens et la mise en page restent fixes |
| `/admin/photos` | Envoyer, modifier ou supprimer une photo (le fichier est effacé du disque), choisir sa page dans une liste, sa description et son ordre |
| `/admin/episodes` | Importer depuis Ausha, changer le type (complet, extrait, replay), modifier le résumé, l'invité et les liens, supprimer (un épisode supprimé revient au prochain import) |
| `/admin/articles` | Écrire (mise en forme Markdown), publier ou dépublier, supprimer un article du blog |
| `/admin/avis` | Ajouter, modifier, afficher ou masquer, supprimer un avis client |
| `/admin/partenaires` | Ajouter, modifier, supprimer un partenaire ; l'afficher une fois son accord obtenu |
| `/admin/utilisateurs` | Voir les comptes, modifier un nom, un téléphone ou un rôle, supprimer un compte (ses réservations sont gardées). Les comptes se créent sur `/inscription` ; le dernier admin ne peut être ni rétrogradé ni supprimé |
| `/admin/newsletter` | Voir les inscrits, ajouter, corriger ou désinscrire une adresse |

Pour que Julie s'en serve sans aide :
- chaque suppression demande une confirmation qui nomme l'élément (« Supprimer l'atelier « … » ? Cette action est définitive. ») ;
- après chaque action, un message dit ce qui a été fait (« Expérience enregistrée ») ou quoi corriger, sous le champ
  en cause (« Champ obligatoire. ») ; une suppression refusée explique pourquoi et propose le bon bouton (« Masquer », « Fermer la session ») ;
- les champs obligatoires sont marqués d'un astérisque, les prix se saisissent en euros (`45` ou `45,50`) ;
- une photo ou une couverture remplacée ou supprimée est effacée du disque, sauf si elle sert encore ailleurs.

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

SMTP_HOST=localhost          # Mailpit en local ; sans SMTP_HOST, e-mails seulement annoncés dans le terminal
SMTP_PORT=1025
SMTP_USER=                   # vides avec Mailpit, identifiants d'un vrai fournisseur en production
SMTP_PASSWORD=
MAIL_FROM="Maison La recette <site@maison-la-recette.local>"
MAIL_ADMIN_TO=julie@exemple.fr   # boîte de Julie (devis, réservations) : adresse fictive en démo

AUSHA_RSS_URL=https://feed.ausha.co/Zg75JI109Rlm   # flux du podcast « la recette » (import des épisodes)
```

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
