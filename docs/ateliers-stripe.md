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
| `POST /api/checkout` | Public (sans compte) | Bloquer les places et ouvrir Stripe Checkout (nom, e-mail, téléphone facultatif et consentement saisis dans le formulaire ; champ piège, limite par IP) |
| `POST /api/webhook` | Signature Stripe | Confirmer un paiement ou libérer une expiration |
| `GET /api/reservations?session_id=cs_test_...` | Public | Résumé sans nom, e-mail ni téléphone, seulement si Stripe confirme que la session existe et désigne la réservation (`404` sinon) |
| `GET /api/reservations?statut=payee` | Admin | Liste des réservations |
| `PATCH /api/reservations/:id` | Admin | Annuler après expiration ou remboursement intégral |
| `POST /api/devis` | Public (sans compte) | Demande B2B (nom, entreprise, e-mail, téléphone saisis ; champ piège, limite par IP, consentement) |
| `GET /api/devis` et `PATCH /api/devis/:id` | Admin | Gestion des demandes B2B |

Les routes admin exigent un compte au rôle `admin` (en développement seulement, `x-admin-key` contre `ADMIN_KEY`
le remplace) ; voir `src/backend/auth/acces.ts`. Les prix et places sont calculés côté serveur. Les champs
inconnus sont refusés. La galerie d'une expérience vient de la table `Image` (page `/experiences/<slug>`).

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
  body: JSON.stringify({ sessionId: 1, nbPersonnes: 2, nom: 'Camille Martin', email: 'camille@example.com', consentement: true }),
});
const result = await response.json();
if (!response.ok) throw new Error(result.error);
window.location.assign(result.checkoutUrl);
```

Réponse : `{ reservationId, montantCents, checkoutUrl }`. Le paiement est en EUR,
par carte, avec les montants issus de SQLite. Ne pas envoyer de montant depuis le
navigateur. Une clé réutilisée pour une autre demande (autre date, autre quantité, autre nom ou autre e-mail)
retourne `409`. Une erreur réseau Stripe retourne `502` : réessayer avec le même UUID.

Le dépôt fournit désormais `/reservation/succes` et `/reservation/annule`.
Le retour d'annulation n'envoie pas d'identifiant de réservation : les places
restent bloquées tant que le paiement Stripe peut encore aboutir (voir ci-dessous). Si la réservation est encore
`en_attente`, la page de succès interroge Stripe (clé secrète) et, s'il confirme le paiement, l'enregistre avec
`traiterSessionStripe`, la fonction du webhook : confirmation et e-mails une seule fois, quel que soit l'ordre
d'arrivée. Le retour navigateur seul ne confirme jamais un paiement et ne libère pas les places.

## Places, événements et annulations

Compatibilité du formulaire existant : le header `Idempotency-Key` est recommandé,
mais peut être omis. Le serveur renvoie alors sa clé dans le header de réponse du
même nom. Sans réutilisation de cette clé, des clics répétés peuvent créer plusieurs
réservations. Les expériences `reservableEnLigne = false` sont refusées au paiement.

- Une transaction SQLite prend un verrou d'écriture avant de compter les places.
  Les réservations `en_attente` bloquent aussi leur quantité ; `placesPrises`
  ne compte que les réservations payées.
- Checkout expire 35 minutes après la création de la réservation (`DUREE_BLOCAGE_MS`).
  Une réservation `en_attente` ne bloque ses places que pendant ce délai + 2 minutes de
  marge d'horloge (`reservationsBloquantes`, `src/backend/places.ts`) : passé ce délai,
  Stripe refuse le paiement, donc les places sont libérées même si
  `checkout.session.expired` n'est jamais arrivé (webhook arrêté). La réservation reste
  `en_attente` jusqu'à cet événement ou jusqu'à l'annulation admin (PATCH), qui la passe à `annulee`.
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
