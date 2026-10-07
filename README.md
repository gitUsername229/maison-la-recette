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
| [public/images/demo/CREDITS.md](public/images/demo/CREDITS.md) | Photos de démonstration : auteurs, liens et licence Unsplash |

## Lancer le projet

Prérequis : Node.js 22.12 ou supérieur et npm.

```bash
git clone https://github.com/gitUsername229/maison-la-recette.git
cd maison-la-recette
npm install
cp .env.example .env.local      # puis remplir les clés (voir ci-dessous)
npx prisma migrate dev          # crée la base SQLite
npx prisma db seed              # données de démo, compte admin, textes des pages, articles et photos de démo
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
- Next.js, React, TypeScript, Tailwind, Prisma (SQLite) ; seed de trois expériences avec sessions, du compte admin,
  des textes des pages (textes d'origine) et de trois articles de démonstration du blog (à remplacer).
- **Comptes** ([Better Auth](https://www.better-auth.com)) : inscription, connexion, déconnexion (`/inscription`, `/connexion`),
  mots de passe hachés en argon2id, session en cookie httpOnly. Rôles `client` et `admin`.
- **Site public sans compte**, alimenté par l'admin (un changement apparaît aussitôt) : accueil (avis, galerie,
  newsletter), `/experiences` et `/experiences/[slug]` (couverture, galerie, dates et places restantes),
  `/a-propos` (partenaires, avis, galerie), `/blog` (voir ci-dessous), `/podcast`, `/studio`.
- **Blog** : 4 catégories (`src/backend/contenus/categories-blog.ts`), une page par catégorie (`/blog/categorie/guides`).
  Sous chaque article : l'épisode lié (« Écouter l'épisode »), les expériences liées avec leurs prochaines dates ouvertes
  (lues dans les sessions, rien à ressaisir) ou un lien vers toutes les expériences, et pour « Pour les entreprises »
  un encadré « Demander un devis ».
- **Référencement** : titre, description, adresse canonique et balises de partage (Open Graph, X) avec la couverture
  pour chaque article ; `/sitemap.xml` et `/robots.txt` (`src/backend/seo.ts`).
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
  `/admin/episodes`), classés en épisodes complets (affichés par défaut), extraits et replays, une saison à la fois
  (liste déroulante), avec le **lecteur sur mesure** de la maquette : il lit le fichier audio du flux (`Episode.audioUrl`).
  Pour revenir au lecteur Ausha (statistiques d'écoute), passer `LECTEUR_PODCAST` à `'ausha'` dans
  `src/backend/podcast/emission.ts`. Liens d'écoute de l'émission dans le même fichier.
- **Expériences** : `/experiences` (Particuliers : une carte par expérience, prochaine date, places restantes, autres
  dates, ou « Sur devis ») et `/experiences/entreprises` (sur-mesure, formats, déroulé appel puis proposition sous 48 h,
  avis, « Obtenir un devis »).
- **Places** : un paiement Stripe expiré ne bloque plus de place, même si l'événement d'expiration n'arrive jamais.

**Reste à faire :**
1. Contenus réels (photos, articles, avis, partenaires, textes des pages) : Julie les saisit dans `/admin`. Le seed
   ne contient que trois articles de démonstration, marqués « Contenu de démonstration à remplacer », et des photos
   provisoires (voir « Thème (maquette Figma) et images provisoires ») : à remplacer. Les épisodes, eux, viennent d'Ausha.
2. En production : `NEXT_PUBLIC_BASE_URL` = la vraie adresse du site (sitemap, adresses canoniques, aperçus de partage),
   puis déclarer `/sitemap.xml` dans Google Search Console.
3. **Questions à Romain (maquette)** : « Événements » ou « Expériences » ; écran d'accueil sans texte (Frame 16) ;
   cartes grises inclinées et icône globe de la page podcast ; logo définitif ; versions ordinateur. Les e-mails
   gardent pour l'instant leurs propres couleurs (`src/backend/mails/modeles.ts`).

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
  - chaque page a un titre (`<title>`) et une meta description (via `metadata` de Next.js) ; les articles et les
    catégories du blog ont aussi une adresse canonique et des balises de partage (`metadonnees()` dans `src/backend/seo.ts`) ;
  - `/sitemap.xml` liste les pages publiques, et `/robots.txt` écarte les pages privées (admin, compte, connexion, API) ;
  - toutes les images ont un texte alternatif (`alt`), obligatoire en base (`imageAlt`, `photoAlt`, `alt`) ;
  - des URLs lisibles grâce aux slugs (`/experiences/atelier-cuisine-anti-gaspi`, `/blog/cuisiner-les-epluchures`).

## Thème (maquette Figma) et images provisoires

Le site suit la maquette UX/UI de Romain (Figma « Workshop 1 », page Maquettes : écrans mobiles) ; la version
ordinateur en est déduite. Le logo reste provisoire, et le libellé « Expériences » est conservé en attendant la réponse
de Romain (la maquette dit « Événements »).

**Couleurs, police et tailles de texte sont dans un seul fichier : [`src/frontend/styles/globals.css`](src/frontend/styles/globals.css).**
- La **palette** (`:root`) reprend les variables Figma (collection « Temp ») et le vert de l'en-tête :

  | Nom | Valeur | Variable Figma | Usage |
  |---|---|---|---|
  | `blanc` | #ffffff | — | Fonds de page |
  | `fond-clair` | #e9edd7 | BG | Cartes, encarts (lecteur, déroulé, réservation) |
  | `vert-fonce` | #123f1b | 1 | Texte, à la place du noir de la maquette |
  | `vert-tendre` | #bdd3a7 | 2 | Aplats, étiquettes |
  | `vert-olive` | #90ae2d | 3 | Décor uniquement |
  | `orange` | #f57f03 | Accent 1 | Décor uniquement (onglet actif, contours d'étiquettes) |
  | `corail` | #c94e3e | Accent 2 (#e75a47) | Boutons ; assombri de 13 % pour le contraste AA du texte blanc |
  | `vert-entete` | #146048 | — | En-tête, menu et pied de page |

  Le corail en couleur de texte (liens, catégories, erreurs) est à peine plus foncé, pour rester AA sur les fonds teintés.
- Les **rôles** (`@theme inline`) sont les seules classes de couleur employées par les composants : `bg-fond`,
  `bg-fond-doux`, `text-texte`, `text-texte-doux`, `bg-primaire`, `text-accent`, `bg-fond-sombre`, `border-decor`…
  Les couleurs par défaut de Tailwind sont retirées : une classe comme `text-stone-600` ne produit rien.
- **Police** : Inria Serif partout (comme la maquette), chargée par `next/font` dans `src/app/layout.tsx`, avec ses
  polices de secours (Georgia, serif).
- **Échelle des tailles** (`--text-*`), tirée de la maquette : 14 px (étiquettes, dates), 16 px (texte courant,
  jamais moins), 20, 24, 28, 32 (titres de page), 40, 48, 58 (menu) et 72 px.
- **Icônes** de la maquette dans `public/images/icones/`, affichées par le composant `Icone` en masque : la forme vient
  du fichier, la couleur du thème.
- `tests/theme.test.ts` vérifie les valeurs Figma, les contrastes WCAG AA de chaque couple utilisé, l'échelle des
  tailles, l'absence de couleur en dur et d'émoji dans les composants, et que l'orange et l'olive ne servent jamais
  de couleur de texte.
- Accessibilité : focus clavier visible partout (vert foncé, blanc dans les zones sombres) ; un seul effet animé, le
  léger zoom des photos au survol des cartes, désactivé avec `prefers-reduced-motion`.
- Pas d'émojis sur le site : ceux des descriptions Ausha sont retirés à l'import et à l'affichage (`sansEmojis`).

**Images de démonstration** : 12 photos [Unsplash](https://unsplash.com/license) (licence libre, usage commercial
autorisé, sans Unsplash+), dans `public/images/demo/` et commitées pour que la démo fonctionne sans internet ; auteurs
et liens dans [`CREDITS.md`](public/images/demo/CREDITS.md). Thèmes : ateliers de cuisine, marchés, producteurs,
légumes de saison, mains qui cuisinent, tablées ; pas de logo de marque ni de visage mis en avant.
Le seed (`prisma/images-demo.ts`) les pose seulement sur les couvertures vides (expériences, articles de démo) et les
pages sans galerie (accueil, à propos, expériences) : une photo choisie dans l'admin n'est jamais remplacée. La première
photo de la galerie de l'accueil sert d'image principale. Pour les remplacer : `/admin/photos`, et la couverture dans
`/admin/experiences` ou `/admin/articles`.

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
| Podcast | **Flux RSS Ausha** importé dans la table `Episode` + lecteur sur mesure (fichier audio du flux), ou lecteur intégré Ausha au choix | Pas de double saisie : les audios restent chez Ausha, seuls les liens et métadonnées sont en base |
| Comptes | **Better Auth** + argon2id (`@node-rs/argon2`) | Librairie reconnue : inscription, connexion, sessions en base et cookie httpOnly, sans authentification faite maison |
| Admin | **Interface `/admin` réservée au rôle admin** + clé `x-admin-key` pour les devs (développement uniquement) | Julie gère le site seule, sans toucher au code (voir plus bas) |

## Pages du site

| Page | Contenu | Public visé | Routes utilisées |
|---|---|---|---|
| Accueil | Présentation de la marque chapeau et des 3 pôles, avis clients, galerie photos, inscription à la newsletter | Tous | `GET /api/avis`, `GET /api/images?page=/`, `POST /api/newsletter` |
| Podcast (`/podcast`) | Lecteur sur mesure (épisode en cours, précédent / suivant, progression), liste de la saison choisie (`?saison=`), complets par défaut, filtre extraits / replays, liens de l'émission (smartlink, Apple Podcasts, Spotify, Deezer, YouTube) | Auditeurs | `GET /api/episodes?type=` |
| Offre podcast | Studio de production pour d'autres marques, sponsoring du podcast | B2B | `POST /api/devis` |
| Expériences (`/experiences`) | Onglet Particuliers : une carte par expérience (prochaine date, places restantes, autres dates, ou « Sur devis ») | B2C | `GET /api/experiences` |
| Expériences entreprises (`/experiences/entreprises`) | Onglet Entreprises : sur-mesure, formats en photos, déroulé, avis, « Obtenir un devis » | B2B | `POST /api/devis` |
| Ateliers / Good tours / Immersions | 1 page par expérience, galerie photos. Ateliers et good tours : sessions réservables en ligne. Immersions (surtout B2B) : sur devis uniquement | B2C et B2B | `GET /api/experiences/[slug]`, `GET /api/sessions`, `POST /api/devis` |
| Blog (`/blog`) | Articles publiés, onglets par catégorie | Tous | `GET /api/articles` |
| Catégorie (`/blog/categorie/[categorie]`) | Les articles d'une catégorie, avec son titre et sa description | Tous (« Pour les entreprises » : B2B) | `GET /api/articles?categorie=` |
| Article (`/blog/[slug]`) | Un article mis en forme en Markdown, puis l'épisode lié, les expériences liées et leurs prochaines dates, l'encadré devis pour les entreprises | Tous | `GET /api/articles/[slug]` |
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
| `/admin/textes` | Modifier les titres, paragraphes et boutons de l'accueil, d'« À propos », du studio, des expériences et du blog (filtre par page), ou remettre le texte d'origine. Les liens et la mise en page restent fixes |
| `/admin/photos` | Envoyer, modifier ou supprimer une photo (le fichier est effacé du disque), choisir sa page dans une liste, sa description et son ordre |
| `/admin/episodes` | Importer depuis Ausha, changer le type (complet, extrait, replay), modifier le résumé, l'invité et les liens, supprimer (un épisode supprimé revient au prochain import) |
| `/admin/articles` | Écrire (mise en forme Markdown), publier ou dépublier, supprimer un article du blog ; choisir sa catégorie, l'épisode lié (du plus récent au plus ancien) et les expériences liées (cases à cocher) ; filtrer par catégorie |
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
