# Backend ateliers et réservations

Les fonctions sont dans `src/backend/ateliers/`. Les fichiers `src/app/api/`
exposent les routes Next.js, sans logique métier côté frontend.

## Routes disponibles

| Route | Accès | Fonction |
|---|---|---|
| `GET /api/experiences?type=atelier` | Public | Expériences actives |
| `GET /api/experiences/:slug` | Public | Détail, galerie et prochaines sessions |
| `POST /api/experiences` | Admin | Créer un atelier ou une autre expérience |
| `PUT /api/experiences/:id` | Admin | Modifier les champs fournis |
| `DELETE /api/experiences/:id` | Admin | Supprimer une expérience sans sessions liées |
| `GET /api/sessions?experience=:slug&disponible=true` | Public | Disponibilités, prix et places restantes |
| `POST /api/sessions` | Admin | Créer une session future |
| `PUT /api/sessions/:id` | Admin | Modifier une session, avec contrôle des places |
| `DELETE /api/sessions/:id` | Admin | Supprimer une session sans réservations |
| `POST /api/checkout` | Public | Bloquer les places et ouvrir Stripe Checkout |
| `POST /api/webhook` | Signature Stripe | Confirmer un paiement ou libérer une expiration |
| `GET /api/reservations?session_id=cs_test_...` | Lien Stripe secret | Résumé sans e-mail ni téléphone |
| `GET /api/reservations?statut=payee` | Admin | Liste des réservations |
| `PATCH /api/reservations/:id` | Admin | Annuler après expiration ou remboursement intégral |
| `POST /api/devis` | Public | Demande B2B |
| `GET /api/devis` et `PATCH /api/devis/:id` | Admin | Gestion des demandes B2B |

Les routes admin vérifient `x-admin-key` contre `ADMIN_KEY`. Les prix et places
sont calculés côté serveur. Les champs inconnus sont refusés. Les fichiers et
l'upload d'images restent à développer ; le catalogue lit déjà la galerie Prisma.

## Installation locale

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Renseigner `STRIPE_SECRET_KEY` avec une clé **sandbox** dans `.env.local`, puis :

```bash
stripe listen --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded --forward-to localhost:3000/api/webhook
```

Copier le secret `whsec_...` affiché par cette commande dans
`STRIPE_WEBHOOK_SECRET`, puis redémarrer le serveur. `NEXT_PUBLIC_BASE_URL`
doit être `http://localhost:3000` en local. Aucune clé secrète ne doit être exposée
dans une variable `NEXT_PUBLIC_*`.

## Ouvrir le paiement depuis le front

Créer un UUID une seule fois pour une tentative de réservation et le conserver
si la requête doit être réessayée. Une nouvelle réservation utilise un nouvel UUID.

```ts
const bookingKey = crypto.randomUUID();
const response = await fetch('/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Idempotency-Key': bookingKey },
  body: JSON.stringify({ sessionId: 1, nom: 'Camille', email: 'camille@example.com', nbPersonnes: 2 }),
});
const result = await response.json();
if (!response.ok) throw new Error(result.error);
window.location.assign(result.checkoutUrl);
```

Réponse : `{ reservationId, montantCents, checkoutUrl }`. Le paiement est en EUR,
par carte, avec les montants issus de SQLite. Ne pas envoyer de montant depuis le
navigateur. Une clé réutilisée avec des coordonnées ou quantités différentes
retourne `409`. Une erreur réseau Stripe retourne `502` : réessayer avec le même UUID.

Le dépôt fournit désormais `/reservation/succes` et `/reservation/annule`.
Le retour d'annulation n'envoie pas d'identifiant de réservation : les places
restent bloquées jusqu'à confirmation Stripe. La page de succès lit
`/api/reservations?session_id=...` et patienter si le statut est encore `en_attente`.
Un retour navigateur ne confirme jamais un paiement et ne libère pas les places.

## Places, événements et annulations

Compatibilité du formulaire existant : le header `Idempotency-Key` est recommandé,
mais peut être omis. Le serveur renvoie alors sa clé dans le header de réponse du
même nom. Sans réutilisation de cette clé, des clics répétés peuvent créer plusieurs
réservations. Les expériences `reservableEnLigne = false` sont refusées au paiement.

- Une transaction SQLite prend un verrou d'écriture avant de compter les places.
  Les réservations `en_attente` bloquent aussi leur quantité ; `placesPrises`
  ne compte que les réservations payées.
- Checkout expire après environ 35 minutes. Les places sont libérées à réception
  de `checkout.session.expired`, ou lorsque l'admin expire le paiement via PATCH.
  Si le webhook est arrêté, les places restent bloquées par sécurité : le relancer
  et renvoyer les événements Stripe, ou annuler les réservations concernées.
- Le webhook vérifie le corps brut, la signature, le mode sandbox, le montant,
  la devise et le lien avec la réservation. Les répétitions sont sans effet.
- Les paramètres Checkout sont enregistrés pour reprendre exactement la même
  requête après un timeout. Si l'identifiant Stripe reste inconnu après 23 heures,
  une intervention est requise : retrouver la session dans Stripe avec la metadata
  `reservationId` et renvoyer son événement signé. Ne pas libérer les places sans
  avoir confirmé qu'aucun paiement ne peut encore aboutir.
- Une réservation payée ne s'annule qu'après un **remboursement intégral effectué
  dans Stripe**. Le PATCH vérifie ce remboursement auprès de Stripe, puis libère
  les places une seule fois. L'API ne déclenche pas elle-même de remboursement ;
  un remboursement partiel ne permet pas l'annulation.
- Les sessions ayant des réservations actives ne peuvent être déplacées ni
  annulées. Leur capacité ne peut pas descendre sous le nombre de places occupées.
  La suppression de sessions avec historique est refusée ; utiliser les statuts.

Cette démo locale ne comporte pas encore de limitation anti-abus des réservations
publiques ni de tâche automatique de rapprochement des paiements.

## Vérifications

`npm test` utilise une base SQLite temporaire et un faux client Stripe. Il couvre
la concurrence, la reprise après timeout, l'idempotence, la signature du webhook,
les montants incorrects, les expirations et les contrôles admin. Aucun appel de
paiement externe n'est effectué par ces tests.

Pour valider réellement l'intégration, créer une réservation via `/api/checkout`,
payer sur Checkout avec la carte sandbox `4242 4242 4242 4242`, puis vérifier le
statut `payee`. Un événement générique créé par `stripe trigger` n'a pas la metadata
de la réservation et est ignoré.

Références Stripe : [Checkout Sessions](https://docs.stripe.com/api/checkout/sessions)
et [expiration d'une session](https://docs.stripe.com/api/checkout/sessions/expire).
