# Maison La recette

Site web de la marque chapeau Maison La recette : podcast, expériences, studio et blog.
Projet de workshop M1 (Groupe 3), 100 % local.

Le site n'a **pas d'administration** : la cliente gère ses événements dans **Luma** et son podcast dans **Ausha** ;
le site les lit et les affiche. Tout le reste (textes, expériences, avis, photos, articles) est du **contenu fixe**
dans le code, dans `src/contenu/`. La base de données ne garde que les demandes de devis et les inscriptions à la
newsletter, aussi envoyées par e-mail à Julie. Un **tableau de bord privé** (`/tableau-de-bord`, un mot de passe
partagé) lui montre ses chiffres du mois, en lecture seule.

## Documentation

| Fichier | Contenu |
|---|---|
| [docs/base-de-donnees.md](docs/base-de-donnees.md) | Les deux tables de la base |
| [docs/api.md](docs/api.md) | Les routes API (devis, newsletter, faux serveur Luma) |
| [docs/curl-public.md](docs/curl-public.md) | Exemples curl de ces routes |
| [public/images/demo/CREDITS.md](public/images/demo/CREDITS.md) | Photos de démonstration : auteurs, liens et licence Unsplash |

## Lancer le projet

Prérequis : Node.js 22.12 ou supérieur et npm.

```bash
git clone https://github.com/gitUsername229/maison-la-recette.git
cd maison-la-recette
npm install
cp .env.example .env.local      # puis vérifier les valeurs (voir « Variables d'environnement »)
npx prisma migrate dev          # crée la base SQLite (demandes de devis, newsletter)
npm run dev                     # http://localhost:3000
```

Sous PowerShell, utiliser `Copy-Item .env.example .env.local` à la place de `cp`.
Les commandes Prisma et Next.js chargent toutes deux le fichier `.env.local`. Il n'y a plus de seed : rien à créer
en base, le contenu est dans le code.

Dans un autre terminal, la boîte mail locale (tous les e-mails du site arrivent sur http://localhost:8025, rien ne
part réellement) :

```bash
docker run --rm -p 8025:8025 -p 1025:1025 axllent/mailpit
```

Après un `git pull` qui ajoute une migration : `npx prisma migrate dev`, puis **redémarrer `npm run dev`** (sinon le
serveur garde l'ancien client Prisma et répond « Un problème technique est survenu »). La migration
`contenus_fixes_luma` supprime les anciennes tables (contenus, épisodes, expériences, sessions, réservations, comptes) ;
les demandes de devis et les inscriptions sont gardées, l'expérience d'un devis devient son slug.

Commandes : `npm test` (base SQLite jetable, n'utilise pas `dev.db`), `npm run lint`, `npm run typecheck`,
`npm run build`, puis `npm start` (après compilation).

## Ce qui se met à jour tout seul

| Quoi | D'où | Comment |
|---|---|---|
| **Événements** (ateliers, food tours) : dates, lieu, prix, places restantes, lien d'inscription | Calendrier **Luma** de la cliente | Lus en GET à l'affichage (`src/backend/luma/client.ts`), gardés 5 minutes en mémoire. Un événement est relié à une expérience par son **étiquette (tag) Luma** (`etiquetteLuma` dans `src/contenu/experiences.ts`). Inscription et paiement se font sur Luma (« Réserver sur Luma », nouvel onglet). Si Luma ne répond pas : dernière réponse gardée, sinon lien de secours vers https://luma.com/larecette |
| **Épisodes du podcast** | Flux RSS **Ausha** (`AUSHA_RSS_URL`) | Lus à l'affichage (`src/backend/podcast/episodes.ts`), gardés 30 minutes en mémoire ; type (complet, extrait, replay), invité et sujet déduits du titre. Si Ausha ne répond pas : dernière lecture gardée, sinon renvoi vers les plateformes d'écoute |
| **Demandes de devis** et **inscriptions à la newsletter** | Formulaires du site | Enregistrées en base et envoyées par e-mail à Julie (`MAIL_ADMIN_TO`) ; accusé de réception au client pour un devis |

## Où modifier le reste

Tout se modifie dans le code, puis se commite et se déploie (en local, `npm run dev` l'affiche aussitôt).

| Pour changer… | Fichier |
|---|---|
| Les textes des pages (titres, paragraphes, boutons, mentions légales, confidentialité) | `src/contenu/textes.ts` : un commentaire dit où chaque texte s'affiche |
| Les expériences (titre, description, durée, photo, Luma ou devis, étiquette Luma) | `src/contenu/experiences.ts` |
| Les avis (les trois avis actuels sont fictifs, `demo: true`, à remplacer) | `src/contenu/avis.ts` |
| Les partenaires (page À propos, après leur accord) | `src/contenu/partenaires.ts` |
| Les photos : fond de l'accueil, galeries (fichiers dans `public/images/`) | `src/contenu/photos.ts` |
| Les articles du blog : un fichier Markdown par article, son nom donne l'adresse | `src/contenu/blog/*.md` (voir ci-dessous) |
| Les catégories du blog | `src/backend/contenus/categories-blog.ts` |
| Le calendrier Luma, Instagram, LinkedIn, les raccourcis du tableau de bord (Ausha, webmail de Julie) | `src/contenu/liens.ts` |
| Les liens d'écoute du podcast, le lecteur (sur mesure ou Ausha) | `src/backend/podcast/emission.ts` |
| L'adresse e-mail de contact affichée | `src/backend/site.ts` |
| Couleurs, polices, tailles | `src/frontend/styles/globals.css` (voir « Thème ») |

**Article du blog** (`src/contenu/blog/mon-article.md` → `/blog/mon-article`) : un en-tête entre deux lignes `---`,
une ligne `clé: valeur` par information, puis le texte en Markdown. Un fichier mal rempli est ignoré et signalé dans
le terminal, sans faire tomber le blog.

```markdown
---
titre: Retour sur un atelier cuisine anti-gaspi
extrait: La phrase qui résume l'article, dans la liste et pour Google.
image: /images/demo/herbes-ciselees.jpg
imageAlt: Des mains ciselent des herbes sur une planche
categorie: retours-experience
date: 2026-10-04
publie: oui
experiences: atelier-cuisine-anti-gaspi, immersion-producteur
episode: Jean Marie Pédron, cueilleur d'algues : celui qui donne le goût des algues
---

Le texte de l'article, en **Markdown**.
```

`categorie` : une clé de `categories-blog.ts` ; `publie: non` cache l'article ; `experiences` (slugs) et `episode`
(titre exact sur Ausha) sont facultatifs et ajoutent leurs blocs sous l'article.

## Luma : passer de la simulation à la vraie API

Par défaut (`LUMA_MODE=simulation`), le site lit un **faux serveur Luma** intégré au projet
(`/api/luma-simule/v1/calendars/events/list` et `/api/luma-simule/v1/events/get`) : mêmes routes, mêmes paramètres
et mêmes formats de réponse que la vraie API, d'après sa spécification officielle
(https://public-api.luma.com/openapi.json). Ses événements sont fictifs (ateliers à 70 €, food tours à 60 €, datés
par rapport au jour) et se modifient dans `src/backend/luma/simulation.ts`. Leur lien « Réserver sur Luma » mène à une
page factice du site, marquée « Simulation Luma », où aucune inscription n'est enregistrée.

Pour lire le vrai calendrier :
1. La cliente crée une clé d'API sur https://luma.com/calendar/manage/api-keys (abonnement **Luma Plus**). La clé
   donne accès à un seul calendrier.
2. Dans `.env.local` (jamais commité) : `LUMA_MODE=api` et `LUMA_API_KEY=` la clé. Redémarrer le serveur.
3. Dans Luma, mettre à chaque événement l'étiquette (tag) de son expérience : `Atelier`, `Food tour`… (champ
   `etiquetteLuma` de `src/contenu/experiences.ts`). Un événement sans étiquette connue s'affiche quand même dans la
   liste des expériences, sans page d'expérience.

En mode `api`, le faux serveur et la page factice répondent 404. **Ce mode n'a pas pu être essayé faute de clé** :
les requêtes (`GET https://public-api.luma.com/v1/calendars/events/list` avec l'en-tête `x-luma-api-key`) et la
lecture des réponses sont vérifiées par les tests sur le format officiel, pas sur le vrai calendrier. À la première
mise en service, vérifier l'affichage des dates, des prix et des places, et les messages `[luma]` du terminal.

## Tableau de bord privé

Page cachée **`/tableau-de-bord`** : aucun lien dans le menu ni le pied de page, absente du sitemap, interdite dans
`/robots.txt` et marquée `noindex`. Elle montre à la cliente ses chiffres du mois, en lecture seule et sans aucune
donnée personnelle (ni nom, ni e-mail, ni téléphone) :

| Bloc | Source | Ce qui est affiché |
|---|---|---|
| Événements | Luma (client existant ; en simulation, chiffres fictifs signalés) | Prochains événements avec inscrits / places et taux de remplissage ; inscrits du mois ; chiffre d'affaires estimé du mois (prix × inscrits des événements payants) ; lien vers Luma |
| Demandes de devis | Base de données | Nombre ce mois-ci et le mois précédent ; répartition par type sur 12 mois ; les 5 dernières (date, type, entreprise) |
| Newsletter | Base de données | Nombre d'inscrits et nouveaux inscrits du mois |
| Podcast | Flux Ausha | Nombre d'épisodes publiés (complets, extraits, replays) et date du dernier |
| Statistiques du site | — | « Bientôt disponible (Plausible, à la mise en ligne) » |
| Raccourcis | `src/contenu/liens.ts` | Luma, Ausha, boîte mail (Mailpit en développement ; `LIEN_BOITE_MAIL` en production, masqué s'il est vide) |

Une source qui ne répond pas affiche un tiret et une phrase d'explication, sans empêcher les autres blocs. Les inscrits
viennent du détail de chaque événement Luma (`guest_counts`, `max_capacity`), jamais de la liste des invités.

**Y accéder** : ouvrir `http://localhost:3000/tableau-de-bord` (en production, l'adresse du site suivie de
`/tableau-de-bord`), saisir le mot de passe partagé. Le navigateur reste connecté 30 jours ; « Se déconnecter » efface
l'accès. Ouvrir la page depuis un favori ou en tapant l'adresse : depuis un lien reçu par e-mail, le navigateur
n'envoie pas le cookie (protection `SameSite=Strict`) et redemande le mot de passe.

**Changer le mot de passe** : dans `.env.local` (jamais commité), modifier `TABLEAU_DE_BORD_MOT_DE_PASSE`, puis
redémarrer le serveur. Tous les navigateurs déjà connectés sont déconnectés (le cookie est signé avec le mot de passe).
`TABLEAU_DE_BORD_SECRET` (32 caractères au moins, ex : `openssl rand -base64 48`) signe le cookie ; le changer
déconnecte aussi tout le monde. Sans l'une des deux variables, la page indique que l'accès n'est pas configuré. En
production, les valeurs factices de `.env.example` (qui contiennent « factice ») laissent le tableau de bord fermé.

Protection (`src/backend/tableau-de-bord/acces.ts`, testée dans `tests/tableau-de-bord.test.ts`) : aucun compte ni
table d'utilisateurs ; mot de passe comparé en temps constant ; 5 tentatives par adresse IP et par quart d'heure
(même en développement), puis `429` ; cookie `httpOnly`, `SameSite=Strict`, `Secure` en production, limité au chemin
`/tableau-de-bord`, signé (HMAC-SHA256) et valable 30 jours. Les chiffres ne sont lus qu'après la vérification du
cookie.

## Séparation front / back

Le projet conserve **Next.js pour le front et les routes API**, avec un seul serveur sur le port 3000 :

```text
src/
  app/              Pages Next.js et points d'entrée /api
  contenu/          Contenu fixe du site : textes, expériences, avis, partenaires, photos, liens, blog (Markdown)
  frontend/         Pages de présentation, composants et styles Tailwind
  backend/          Lecture de Luma et d'Ausha, devis, newsletter, e-mails, anti-spam, référencement, tableau de bord
prisma/             Schéma SQLite et migrations
public/images/      Images locales
```

Les fichiers `src/app/**/page.tsx` et `src/app/api/**/route.ts` délèguent aux dossiers front et back. Les modules du
backend sont réservés au serveur (`server-only`) ; le frontend ne les importe jamais (règle ESLint).

### État du projet

**En place :**
- Next.js, React, TypeScript, Tailwind, Prisma (SQLite), sans compte ni administration.
- **Accueil** (photo, podcast avec le dernier extrait, expériences et leurs prochaines dates Luma, avis, offre
  entreprises, studio, newsletter), **Podcast**, **Expériences** (particuliers et entreprises), une page par
  expérience, **Blog** (4 catégories, une page par catégorie et par article), **À propos**, **Studio**, **Contact**
  (demande de devis), **Mentions légales** et **Confidentialité** (texte de base à compléter).
- **Événements Luma** : prochaines dates (titre, date, lieu, prix, places si Luma les donne) avec « Réserver sur Luma »,
  « Prochaines dates bientôt » sans événement, événements passés par année ; immersions et entreprises sur devis.
- **Podcast Ausha** : épisodes complets, extraits et replays, une saison à la fois, lecteur sur mesure (fichier audio
  du flux) ou lecteur Ausha (`LECTEUR_PODCAST` dans `src/backend/podcast/emission.ts`).
- **Demande de devis** (`/contact`) et **newsletter** (accueil), sans compte, avec anti-spam (voir plus bas) ;
  e-mails par Nodemailer (Mailpit en local), envoyés après la réponse : un échec est journalisé sans rien annuler.
- **Référencement** : titre, description, adresse canonique et balises de partage ; `/sitemap.xml` et `/robots.txt`
  (`src/backend/seo.ts`).
- **Tableau de bord privé** (`/tableau-de-bord`) : chiffres du mois (Luma, devis, newsletter, podcast), derrière un
  mot de passe partagé (voir plus haut).

**Reste à faire :**
1. Contenus réels : textes, avis (les trois avis actuels sont fictifs), partenaires, photos (provisoires, Unsplash),
   articles du blog (trois articles de démonstration) ; voir « Où modifier le reste ».
2. Luma : passer en mode `api` avec la clé de la cliente et étiqueter ses événements (voir plus haut).
3. En production : `NEXT_PUBLIC_BASE_URL` = la vraie adresse du site (sitemap, adresses canoniques, aperçus de partage,
   faux serveur Luma), puis déclarer `/sitemap.xml` dans Google Search Console. Tableau de bord : choisir le mot de
   passe et un secret aléatoire (voir « Tableau de bord privé »), renseigner `LIEN_BOITE_MAIL` (webmail de Julie) et,
   à la mise en ligne, brancher Plausible à la place de « Bientôt disponible ».
4. **Mentions légales et politique de confidentialité** : compléter les éléments entre crochets (forme juridique,
   SIRET, hébergeur, prestataires, durées de conservation), faire valider le texte par la cliente, puis vider
   `avertissement` dans `src/contenu/textes.ts`.
5. **Questions à Romain (maquette)** : icônes de la coche (« Pour les entreprises ») et de l'onde sonore (épisode en
   cours), non fournies ; vrais logos clients pour « Ils me font confiance » (ceux de la maquette sont provisoires) et
   autorisation de les afficher ; valeurs des autres couleurs (cartes, orange, corail, texte : le site garde les
   siennes) ; la photo `aproposnous.svg` (Julie ?) est-elle pour la page À propos ? Les e-mails gardent leurs propres
   couleurs (`src/backend/mails/modeles.ts`).

**Améliorations futures** (pas urgentes, à faire en équipe) :
- **Prisma 7**, version stable actuelle (le projet est en 6.19, non dépréciée) : adaptateur SQLite
  (« driver adapter »), nouveau générateur `prisma-client` et imports du client à adapter partout.
- **Cache Components**, nouveau modèle de cache de Next.js 16 (optionnel) : activer `cacheComponents`
  et restructurer les pages (`Suspense`, `"use cache"`).
- **Newsletter** : confirmation de l'inscription par e-mail (double opt-in), lien de désinscription et envoi des
  adresses à l'outil d'envoi (Brevo, Mailchimp…). Aujourd'hui, chaque adresse est enregistrée et envoyée à Julie.
- **ESLint 10**, dès que la config ESLint de Next.js le supportera (ses plugins `react`, `import` et `jsx-a11y`
  s'arrêtent à ESLint 9, d'où l'avertissement `npm warn deprecated eslint@9` à l'installation).

> ⚠️ **Ne jamais lancer `npm audit fix --force`.** Les alertes de `npm audit` viennent d'outils de développement
> (CLI Prisma, plugin ESLint de Next), sans version corrigée disponible ; ce « correctif » rétrograderait
> `eslint-config-next` en v14 et `prisma` en 6.12 et casserait le projet.

### Sécurité

- **Ni compte ni administration** : aucune route de modification. Les anciennes adresses `/admin` répondent 404. Le
  contenu ne change que par le code (relu, commité). Seul le tableau de bord, en lecture seule, demande un mot de
  passe partagé (voir « Tableau de bord privé »).
- Les seules écritures sont les deux formulaires publics, protégés contre les robots (voir ci-dessous) ; tout ce qui
  est saisi est validé côté serveur (zod) et échappé dans les e-mails (impossible d'y injecter du HTML).
- La clé Luma (`LUMA_API_KEY`) reste côté serveur : le navigateur ne voit que les événements publics. Les événements
  privés ou réservés aux membres ne sont jamais affichés.
- Le faux serveur Luma n'existe qu'en simulation, et exige l'en-tête `x-luma-api-key` comme la vraie API.

### Anti-spam des formulaires publics

| Protection | Devis (`/api/devis`) | Newsletter (`/api/newsletter`) |
|---|---|---|
| Champ piège `siteWeb` rempli (robot) | `201` comme d'habitude, rien d'enregistré ni d'envoyé | `201`, rien d'enregistré ni d'envoyé |
| Limite d'envois par IP (`429`) | 5 / 10 min | 5 / 10 min |
| Case de consentement (lien vers `/confidentialite`) | obligatoire, date en base (`consentementLe`) | obligatoire, date en base |

- Les limites ci-dessus valent en production ; en développement (`npm run dev`), elles sont **20 fois plus larges**
  (essais et démonstrations depuis la même adresse). Pour les changer : `LIMITE_DEVIS`, `LIMITE_NEWSLETTER` et
  `LIMITE_PERIODE_MINUTES` dans `.env.local` (voir `.env.example`), puis redémarrer.
- Les compteurs sont en mémoire : remis à zéro au redémarrage et propres à un serveur (suffisant pour un seul
  serveur ; avec plusieurs, il faudrait un stockage partagé comme Redis).
- Adresse IP : `x-forwarded-for` n'est cru que derrière un proxy de confiance (`PROXY_DE_CONFIANCE`, nombre de proxys,
  ex : `1` derrière nginx). Sans proxy, l'en-tête envoyé par le visiteur est retiré au démarrage du serveur
  (`src/instrumentation.ts`) et Next.js y écrit l'IP de connexion.

## Principes du site

- **Français uniquement** : pas de traduction, `<html lang="fr">`, dates et prix au format français (`14 novembre 2026`, `70,00 €`).
- **Mobile d'abord** : chaque page est pensée pour le téléphone, puis élargie pour la tablette et l'ordinateur (préfixes Tailwind `md:` et `lg:`).
- **SEO de base** :
  - chaque page a un titre (`<title>`) et une meta description ; les articles, les expériences et les catégories du
    blog ont aussi une adresse canonique et des balises de partage (`metadonnees()` dans `src/backend/seo.ts`) ;
  - `/sitemap.xml` liste les pages publiques, les expériences et les articles ; `/robots.txt` écarte l'API, le
    tableau de bord et la page factice de simulation Luma ;
  - toutes les images ont un texte alternatif (`alt`, `imageAlt` dans les fichiers de contenu) ;
  - des URLs lisibles grâce aux slugs (`/experiences/atelier-cuisine-anti-gaspi`, `/blog/retour-atelier-cuisine-anti-gaspi`).

## Thème (maquette Figma) et images provisoires

Le site suit la maquette UX/UI de Romain (Figma « Workshop 1 », page Maquettes : écrans mobiles, mise à jour du
8 octobre 2026 pour l'accueil, le podcast et les deux onglets Expériences) ; la version ordinateur en est déduite, et les
pages sans maquette en reprennent le style (fond vert clair, cartes blanches, grands boutons arrondis, titres en 40 px).
Logo dessiné, polices (Anton, Inria Sans), vert vif, icônes des plateformes et carottes de notation viennent des
fichiers de Romain ; le libellé « Expériences » est conservé (la maquette dit « Événements »), ainsi que « food tours ».

**Couleurs, police et tailles de texte sont dans un seul fichier : [`src/frontend/styles/globals.css`](src/frontend/styles/globals.css).**
- La **palette** (`:root`) reprend les variables Figma (collection « Temp ») et le vert vif de la maquette :

  | Nom | Valeur | Variable Figma | Usage |
  |---|---|---|---|
  | `blanc` | #ffffff | — | Cartes et encarts (lecteur, épisodes, expériences, dates) |
  | `fond-clair` | #e9edd7 | BG | Fond des pages, en-tête et pied de page |
  | `vert-fonce` | #123f1b | 1 | Texte, à la place du noir de la maquette |
  | `vert-tendre` | #bdd3a7 | 2 | Aplats, étiquettes |
  | `vert-olive` | #90ae2d | 3 | Décor uniquement |
  | `orange` | #f57f03 | Accent 1 | Boutons et étiquettes secondaires, avec texte vert foncé (le blanc n'atteint pas AA) ; jamais en couleur de texte |
  | `corail` | #c94e3e | Accent 2 (#e75a47) | Boutons ; assombri de 13 % pour le contraste AA du texte blanc |
  | `vert-vif` | #187622 | vert vif | Titres, menu ouvert, sections sombres de l'accueil (expériences, newsletter), étiquettes |

  Le corail en couleur de texte (liens, catégories, erreurs) est à peine plus foncé, pour rester AA sur les fonds teintés.
- Les **rôles** (`@theme inline`) sont les seules classes de couleur employées par les composants : `bg-fond`,
  `bg-fond-doux`, `text-texte`, `text-texte-doux`, `bg-primaire`, `bg-secondaire`, `text-accent`, `bg-fond-sombre`, `border-decor`…
  Les couleurs par défaut de Tailwind sont retirées : une classe comme `text-stone-600` ne produit rien.
- **Polices** (maquette) : Anton pour les titres (classe `font-titre`, une seule graisse : jamais `font-bold`), Inria
  Sans pour le texte et les boutons, chargées par `next/font` dans `src/app/layout.tsx` avec leurs polices de secours.
- **Échelle des tailles** (`--text-*`), tirée de la maquette : 14 px (étiquettes, dates), 16 px (texte courant,
  jamais moins : 15 px dans la maquette), 20 (boutons), 24, 28, 32, 40 (titres de page), 48, 58 (menu) et 72 px.
- **Logos** : le logo dessiné (`public/images/logo-maison-la-recette.svg`), le logo du podcast et ceux des plateformes
  d'écoute ont des tailles adaptées à l'écran (téléphone, tablette, ordinateur), fixées une seule fois dans
  `globals.css` (variables `--logo-*`) ; les SVG n'ont qu'un viewBox, sans largeur ni hauteur fixes.
- **Icônes** de la maquette dans `public/images/icones/`, affichées par le composant `Icone` en masque : la forme vient
  du fichier, la couleur du thème.
- `tests/theme.test.ts` vérifie les valeurs Figma, les contrastes WCAG AA de chaque couple utilisé, l'échelle des
  tailles, l'absence de couleur en dur et d'émoji dans les composants, et que l'orange et l'olive ne servent jamais
  de couleur de texte.
- Accessibilité : focus clavier visible partout (vert foncé, blanc dans les zones sombres) ; un seul effet animé, le
  léger zoom des photos au survol des cartes, désactivé avec `prefers-reduced-motion`.
- Pas d'émojis sur le site : ceux des descriptions Ausha sont retirés à l'affichage (`sansEmojis`).

**Images de démonstration** : 12 photos [Unsplash](https://unsplash.com/license) (licence libre, usage commercial
autorisé, sans Unsplash+), dans `public/images/demo/` et commitées pour que la démo fonctionne sans internet ; auteurs
et liens dans [`CREDITS.md`](public/images/demo/CREDITS.md). Thèmes : ateliers de cuisine, marchés, producteurs,
légumes de saison, mains qui cuisinent, tablées ; pas de logo de marque ni de visage mis en avant. Le fond de l'accueil
est la serre de la maquette (`public/images/accueil/fond-accueil.jpg`) ; la mosaïque « Pour les entreprises » reprend
les galeries des expériences, puis leurs couvertures. Tout se remplace dans `src/contenu/photos.ts` et
`src/contenu/experiences.ts`.

## Technologies utilisées

Tout tourne en local sur `http://localhost:3000`.

| Couche | Techno | Pourquoi |
|---|---|---|
| Front | **Next.js (React) + Tailwind CSS** | Un seul projet pour toutes les pages, rendu fidèle aux maquettes Figma |
| Back | **Routes API de Next.js** | Pas de serveur séparé : front et back se lancent avec `npm run dev` |
| Contenu | **Fichiers TypeScript et Markdown** (`src/contenu/`) | Pas d'administration à maintenir : le contenu change par le code |
| Événements | **API Luma** (lecture seule) + faux serveur de simulation | La cliente gère ses événements, inscriptions et paiements dans Luma ; le site les affiche |
| Podcast | **Flux RSS Ausha** lu à l'affichage + lecteur sur mesure (fichier audio du flux), ou lecteur intégré Ausha au choix | Pas de double saisie : les audios et leurs informations restent chez Ausha |
| Base de données | **SQLite + Prisma** | Un simple fichier pour les demandes de devis et la newsletter |
| E-mails | **Nodemailer + Mailpit** | Devis et inscriptions envoyés à Julie, accusé au client ; en local, Mailpit capture les e-mails sans rien envoyer. En production, il suffit de changer `SMTP_*` |
| Images | **Dossier `public/images/`** | Pas d'hébergement externe, les images sont servies par Next.js |

## Pages du site

| Page | Contenu | Public visé | Données |
|---|---|---|---|
| Accueil | Photo plein écran et accroche ; le podcast (dernier extrait, plateformes) ; les expériences et leur prochaine date ; la note moyenne des avis ; l'offre entreprises ; le studio ; la newsletter | Tous | `src/contenu/`, Luma, Ausha, `POST /api/newsletter` |
| Podcast (`/podcast`) | Présentation de l'émission, liens d'écoute, lecteur sur mesure (invité et sujet lus dans le titre, progression, −15 s / +30 s, résumé replié), saison choisie (`?saison=`), complets par défaut, filtre extraits / replays | Auditeurs | Ausha |
| Studio (`/studio`) | Studio de production pour d'autres marques, sponsoring du podcast | B2B | `src/contenu/textes.ts` |
| Expériences (`/experiences`) | Onglet Particuliers : prochains événements Luma (« Réserver sur Luma »), expériences sur devis, avis, événements passés de l'année choisie (`?annee=`) | B2C | Luma, `src/contenu/` |
| Expériences entreprises (`/experiences/entreprises`) | Onglet Entreprises : présentation du sur-mesure, mosaïque de photos, « Demander un devis », témoignages | B2B | `src/contenu/` |
| Une expérience (`/experiences/[slug]`) | Présentation, galerie et prochaines dates Luma ; immersions : sur devis | B2C et B2B | `src/contenu/experiences.ts`, Luma |
| Blog (`/blog`, `/blog/categorie/[categorie]`) | Articles publiés, onglets par catégorie | Tous | `src/contenu/blog/` |
| Article (`/blog/[slug]`) | Un article en Markdown, puis l'épisode lié, les expériences liées et leurs prochaines dates, l'encadré devis pour les entreprises | Tous | `src/contenu/blog/`, Ausha, Luma |
| À propos | Mission, histoire, partenaires, avis, galerie photos | Tous | `src/contenu/` |
| Contact (`/contact`) | Demande de devis sans compte (expérience, sponsoring, studio, événement ; réponse sous 48 h) | B2B | `POST /api/devis` |
| Mentions légales, Confidentialité | Texte de base à compléter (`src/contenu/textes.ts`) | Tous | — |
| Tableau de bord (`/tableau-de-bord`) | Page privée (mot de passe partagé) : chiffres du mois, prochains événements et remplissage, devis, newsletter, podcast, raccourcis | La cliente | Luma, base, Ausha |
| Simulation Luma (`/luma-simule/[id]`) | Page factice d'inscription Luma, en simulation seulement (non indexée) | Démo | faux serveur Luma |

Pas de logos clients : la crédibilité passe par les avis et les partenaires (affichés seulement après leur accord).

## Variables d'environnement

`.env.example` (à copier en `.env.local`, qui n'est jamais commité) :

```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_BASE_URL=http://localhost:3000

SMTP_HOST=localhost          # Mailpit en local ; sans SMTP_HOST, e-mails seulement annoncés dans le terminal
SMTP_PORT=1025
SMTP_USER=                   # vides avec Mailpit, identifiants d'un vrai fournisseur en production
SMTP_PASSWORD=
MAIL_FROM="Maison La recette <site@maison-la-recette.local>"
MAIL_ADMIN_TO=julie@exemple.fr   # boîte de Julie (devis, newsletter) : adresse fictive en démo

LUMA_MODE=simulation             # ou api (vraie API, avec LUMA_API_KEY)
# LUMA_API_KEY=                  # clé du calendrier Luma (Luma Plus), seulement avec LUMA_MODE=api

AUSHA_RSS_URL=https://feed.ausha.co/Zg75JI109Rlm   # flux du podcast « la recette »

TABLEAU_DE_BORD_MOT_DE_PASSE=mot-de-passe-factice   # mot de passe partagé du tableau de bord privé
TABLEAU_DE_BORD_SECRET=secret-factice-a-remplacer-par-48-caracteres-aleatoires   # signe le cookie (32 caractères min.)

# Facultatif : anti-spam (valeurs par défaut en production, 20 fois plus larges en développement)
# LIMITE_PERIODE_MINUTES=10
# LIMITE_DEVIS=5
# LIMITE_NEWSLETTER=5
# PROXY_DE_CONFIANCE=0                              # nombre de proxys devant le site (x-forwarded-for)
```

Les anciennes variables (`STRIPE_*`, `BETTER_AUTH_SECRET`, `ADMIN_*`) ne servent plus : elles peuvent être retirées de
`.env.local`.
