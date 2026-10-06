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
| `src/app/api/reservations/route.ts` | `GET` : retrouve une réservation (public) ou les liste (admin) |
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

## Utiliser le formulaire sur une page d'expérience

Exemple dans une page serveur (par exemple `src/app/experiences/ateliers/page.tsx`) :

```tsx
import { prisma } from "@/backend/db/prisma";
import { placesDisponibles } from "@/backend/places";
import ReservationForm from "@/frontend/components/ReservationForm";

export const dynamic = "force-dynamic";

export default async function PageAteliers() {
  const experience = await prisma.experience.findUnique({
    where: { slug: "atelier-cuisine-anti-gaspi" },
    include: {
      sessions: {
        where: { statut: "ouverte", dateDebut: { gt: new Date() } },
        orderBy: { dateDebut: "asc" },
      },
    },
  });
  if (!experience) return null;

  const sessions = await Promise.all(
    experience.sessions.map(async (s) => ({
      id: s.id,
      dateDebut: s.dateDebut.toISOString(),
      lieu: s.lieu,
      prixCents: s.prixCents ?? experience.prixCents,
      placesRestantes: await placesDisponibles(prisma, s.id),
    }))
  );

  return (
    <main>
      <h1>{experience.titre}</h1>
      {experience.reservableEnLigne ? (
        <ReservationForm sessions={sessions} />
      ) : (
        <a href="/contact">Demander un devis</a>
      )}
    </main>
  );
}
```

Les pages `/reservation/succes` et `/reservation/annule` renvoient vers `/experiences` en attendant les pages d'expériences. Remplacer ce lien par `/experiences/[slug]` quand elles existeront.

## Parcours complet

1. La personne choisit une date, le nombre de participants, son nom et son e-mail.
2. `POST /api/checkout` vérifie les places, crée une réservation `en_attente` et une session Stripe expirant après 35 min. Les places restent bloquées jusqu'à confirmation d'expiration par Stripe. Un header `Idempotency-Key` UUID est recommandé pour les reprises ; il reste optionnel pour le formulaire existant.
3. Redirection vers la page de paiement Stripe.
4. **Paiement réussi** : Stripe redirige vers `/reservation/succes` et envoie `checkout.session.completed` au webhook. La réservation passe à `payee`, les places sont comptées, et la session passe à `complete` si elle est pleine.
5. **Retour sans paiement** : Stripe redirige vers `/reservation/annule` sans identifiant de réservation. Les places sont libérées à réception de l'expiration Stripe ou après annulation admin vérifiée.
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

# 3. Tests
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"sessionId":1,"nom":"Camille Martin","email":"camille@example.com","nbPersonnes":2}'
```

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
- Revenir depuis Stripe : retour sur `/reservation/annule`, puis réservation `annulee` après expiration Stripe ou annulation admin.
- Payer la dernière place : la session passe à `complete` et disparaît du formulaire.
- Couper `stripe listen` puis payer : la page de succès affiche quand même « Votre place est réservée » (vérification directe auprès de Stripe), mais la base n'est pas mise à jour. **Toujours lancer `stripe listen` pendant la démo.**

## Reste à faire

- Envoi de l'e-mail de confirmation au client et à Julie (voir le `TODO` dans `src/app/api/webhook/route.ts`, avec Nodemailer + Mailpit).
- Style du formulaire et des pages de retour selon les maquettes de la DA.
