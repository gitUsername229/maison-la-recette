# Paiement Stripe Checkout (sandbox)

Paiement en ligne des expériences réservables par les particuliers (ateliers, good tours).
Les immersions et les demandes d'entreprises passent par le devis, pas par Stripe.

Tout est simulé : aucun vrai argent, aucune vérification d'identité.

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/backend/payments/stripe.ts` | Client Stripe sandbox, via `getStripe()` (serveur uniquement) |
| `src/backend/db/prisma.ts` | Connexion à la base (serveur uniquement) |
| `src/backend/places.ts` | Calcul des places disponibles, évite la double réservation (serveur uniquement) |
| `src/backend/auth/admin.ts` | Contrôle de la clé `x-admin-key` (liste admin des réservations) |
| `src/app/api/checkout/route.ts` | `POST` : crée la réservation et la page de paiement Stripe |
| `src/app/api/webhook/route.ts` | `POST` : reçoit la confirmation de Stripe |
| `src/app/api/reservations/route.ts` | `GET` : retrouve une réservation (son propriétaire connecté) ou les liste (admin) |
| `src/app/reservation/succes/page.tsx` | Page affichée après un paiement réussi |
| `src/app/reservation/annule/page.tsx` | Page affichée si la personne annule le paiement (libère les places) |
| `src/frontend/components/ReservationForm.tsx` | Formulaire de réservation à placer sur les pages d'expériences |

## Installation

### 1. Paquet Stripe

```bash
npm install stripe
```

### 2. Compte et clés

1. Créer un compte sur [dashboard.stripe.com](https://dashboard.stripe.com) (gratuit).
2. Rester dans une **sandbox** (environnement de test).
3. Dans **Développeurs > Clés API**, copier la clé publique (`pk_test_...`) et la clé secrète (`sk_test_...`).

### 3. Stripe CLI (pour recevoir les webhooks en local)

Sur macOS, Windows et Linux (Node.js est déjà installé pour le projet) :

```bash
npm install -g @stripe/cli
stripe login
```

`stripe login` affiche un code et ouvre le navigateur : valider l'accès en choisissant **la même sandbox**
que celle des clés `sk_test_`, sinon les webhooks n'arrivent pas. Sans `stripe login`, on peut aussi
donner la clé secrète à la CLI avec la variable d'environnement `STRIPE_API_KEY`.

### 4. Variables d'environnement (`.env.local`)

```
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ADMIN_KEY=ma-cle-secrete
```

`STRIPE_WEBHOOK_SECRET` est affiché par `stripe listen` (voir plus bas). Il change à chaque nouvelle connexion de la CLI sur une autre machine : chaque dev a le sien.

## Champs Prisma nécessaires

Le code utilise ces champs. Vérifier qu'ils existent dans `prisma/schema.prisma` :

```prisma
model Experience {
  // ...
  slug              String   @unique
  titre             String
  prixCents         Int
  reservableEnLigne Boolean  @default(true)
  sessions          Session[]
}

model Session {
  // ...
  experienceId  Int
  experience    Experience @relation(fields: [experienceId], references: [id])
  dateDebut     DateTime
  lieu          String
  placesTotal   Int
  placesPrises  Int      @default(0)
  prixCents     Int?
  statut        String   @default("ouverte")   // ouverte | complete | annulee
  reservations  Reservation[]
}

model Reservation {
  // ...
  sessionId       Int
  session         Session  @relation(fields: [sessionId], references: [id])
  nom             String
  email           String
  telephone       String?
  nbPersonnes     Int
  montantCents    Int
  statut          String   @default("en_attente")  // en_attente | payee | annulee
  stripeSessionId String?  @unique
  createdAt       DateTime @default(now())
}
```

Après modification : `npx prisma migrate dev`.

## Pages qui affichent le formulaire

Le formulaire est affiché sur `/experiences/[slug]` (accessible depuis l'accueil, bouton « Réserver une expérience ») :

| Fichier | Rôle |
|---|---|
| `src/app/experiences/page.tsx` | Charge les expériences actives (`experiencesActives`) |
| `src/app/experiences/[slug]/page.tsx` | Charge l'expérience et ses sessions ouvertes (`experiencePublique`), les passe au front |
| `src/frontend/pages/experiences.tsx` | Liste des expériences |
| `src/frontend/pages/experience.tsx` | Détail + `ReservationForm` (ou « Se connecter pour réserver » pour un visiteur), ou « Demander un devis » si `reservableEnLigne = false` |

Les données sont chargées dans `src/app` car ESLint interdit à `src/frontend` d'importer le backend.
En développement, la page rappelle la carte de test `4242 4242 4242 4242` sous le bouton de paiement.

Les pages `/reservation/succes` et `/reservation/annule` renvoient vers la liste `/experiences`.

## Parcours complet

1. La personne, **connectée à son compte**, choisit une date et le nombre de participants. Le nom, l'e-mail et le téléphone de la réservation sont ceux du compte (lus par le serveur, jamais envoyés par le formulaire).
2. `POST /api/checkout` vérifie les places, crée une réservation `en_attente` et une session Stripe expirant après 35 min. Les places restent bloquées tant que ce paiement peut aboutir (35 min + 2 min de marge), puis sont libérées automatiquement, même si l'événement d'expiration n'arrive jamais. Un header `Idempotency-Key` UUID est recommandé pour les reprises ; il reste optionnel pour le formulaire existant.
3. Redirection vers la page de paiement Stripe.
4. **Paiement réussi** : Stripe redirige vers `/reservation/succes` et envoie `checkout.session.completed` au webhook. La réservation passe à `payee`, les places sont comptées, et la session passe à `complete` si elle est pleine.
5. **Retour sans paiement** : Stripe redirige vers `/reservation/annule` sans identifiant de réservation. Les places sont libérées à l'expiration du paiement (35 min + marge), sans attendre l'événement Stripe.
6. **Page de paiement abandonnée** : après 35 min, Stripe envoie `checkout.session.expired` et la réservation passe à `annulee`.

Voir [le guide du backend ateliers](ateliers-stripe.md) pour les règles de reprise,
les annulations après remboursement et les tests automatisés.

## Tester en local

Trois terminaux :

```bash
# 1. Le site
npm run dev

# 2. Les webhooks Stripe → copier le whsec_... affiché dans .env.local, puis relancer npm run dev
#    (--events est obligatoire avec les versions récentes de la CLI : ce sont les événements traités par le webhook)
stripe listen --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed --forward-to localhost:3000/api/webhook

# 3. Tests : se connecter (compte créé sur /inscription), puis réserver
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -c cookies.txt \
  -d '{"email":"camille@example.com","password":"un-mot-de-passe"}'
curl -X POST http://localhost:3000/api/checkout -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"sessionId":1,"nbPersonnes":2}'
```

Le plus simple reste le navigateur : accueil → « Réserver une expérience » → l'atelier → se connecter → « Réserver et payer ».
Sans compte connecté, `POST /api/checkout` répond `401`.

Ouvrir le `checkoutUrl` renvoyé et payer avec une carte de test (date future et CVC quelconques) :

| Carte | Résultat |
|---|---|
| `4242 4242 4242 4242` | Paiement accepté |
| `4000 0025 0000 3155` | Demande une authentification (3D Secure) |
| `4000 0000 0000 9995` | Refusé (fonds insuffisants) |

Vérifier ensuite :

```bash
npx prisma studio   # la réservation est "payee" et placesPrises a augmenté
```

## Cas à tester avant la démo

- Réserver plus de places qu'il n'en reste : erreur `409` « Il ne reste que X places ».
- Réserver une immersion (`reservableEnLigne = false`) : erreur `400`.
- Réserver sans être connecté : bouton « Se connecter pour réserver » sur la page, `401` sur l'API.
- Ouvrir `/reservation/succes?session_id=…` d'une réservation avec le compte d'un autre client : « Réservation introuvable ».
- Revenir depuis Stripe : retour sur `/reservation/annule`, puis réservation `annulee` après expiration Stripe ou annulation admin.
- Payer la dernière place : la session passe à `complete` et disparaît du formulaire.
- Couper `stripe listen` puis payer : la page de succès affiche quand même « Votre place est réservée » (vérification directe auprès de Stripe), mais la base n'est pas mise à jour et l'e-mail de confirmation ne part pas. **Toujours lancer `stripe listen` pendant la démo.**

## E-mails

Quand le webhook confirme un paiement, le client reçoit sa confirmation et Julie (`MAIL_ADMIN_TO`) une information,
une seule fois même si Stripe renvoie l'événement (`src/backend/mails/notifications.ts`). En local, ils arrivent dans
Mailpit : http://localhost:8025.

## Reste à faire

- Style du formulaire et des pages de retour selon les maquettes de la DA.
