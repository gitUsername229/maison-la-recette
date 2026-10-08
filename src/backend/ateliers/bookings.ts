import 'server-only';
import type { Prisma } from '@prisma/client';
import type Stripe from 'stripe';
import { prisma } from '@/backend/db/prisma';
import { ApiError } from '@/backend/http';
import { getStripe } from '@/backend/payments/stripe';
import { enArrierePlan } from '@/backend/mails/envoi';
import { envoyerMailsReservationPayee } from '@/backend/mails/notifications';
import { DUREE_BLOCAGE_MS, placesDisponibles } from '@/backend/places';
import { lockSession } from './inventory';
import type { CheckoutInput } from './validation';

function configuredStripe() {
  try { return getStripe(); }
  catch { throw new ApiError(503, 'Configurer les clés Stripe sandbox avant de réserver'); }
}

export async function attachCheckout(reservationId: number, stripe: Stripe) {
  const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
  if (reservation.stripeSessionId) return stripe.checkout.sessions.retrieve(reservation.stripeSessionId);
  if (!reservation.checkoutPayload || !reservation.checkoutKey) throw new ApiError(409, 'Réservation sans données de paiement');
  // Au-delà, Stripe pourrait avoir purgé la clé d’idempotence. Ne jamais recréer
  // aveuglément un paiement dont le résultat réseau est inconnu.
  if (Date.now() - reservation.createdAt.getTime() > 23 * 60 * 60 * 1000) throw new ApiError(409, 'Paiement à rapprocher manuellement dans Stripe avant de libérer les places');
  const session = await stripe.checkout.sessions.create(JSON.parse(reservation.checkoutPayload) as Stripe.Checkout.SessionCreateParams, { idempotencyKey: reservation.checkoutKey });
  await prisma.reservation.update({ where: { id: reservationId }, data: { stripeSessionId: session.id } });
  return session;
}

/** Réservation sans compte : nom, e-mail et téléphone sont ceux saisis dans le formulaire. */
export async function createCheckout(input: CheckoutInput, key: string, stripe: Stripe = configuredStripe()) {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (!base || !/^https?:\/\//.test(base)) throw new ApiError(503, 'NEXT_PUBLIC_BASE_URL doit être configurée');
  const origin = new URL(base).origin;
  const reservation = await prisma.$transaction(async tx => {
    const session = await lockSession(tx, input.sessionId);
    const previous = await tx.reservation.findUnique({ where: { checkoutKey: key } });
    if (previous) {
      // Une clé ne resservira qu'à la même demande : même date, même nombre de places, même personne.
      const memeDemande = previous.sessionId === input.sessionId && previous.nbPersonnes === input.nbPersonnes && previous.nom === input.nom && previous.email === input.email;
      if (!memeDemande) throw new ApiError(409, 'Cette clé de réservation est déjà utilisée pour une autre demande');
      if (previous.statut !== 'en_attente') throw new ApiError(409, 'Réservation déjà traitée');
      return previous;
    }
    if (!session.experience.actif || session.statut !== 'ouverte' || session.dateDebut <= new Date()) throw new ApiError(409, 'Session non réservable');
    if (!session.experience.reservableEnLigne) throw new ApiError(400, 'Cette expérience se réserve sur devis');
    const remaining = await placesDisponibles(tx, session.id);
    if (input.nbPersonnes > remaining) throw new ApiError(409, `Il ne reste que ${remaining} place(s)`);
    const unitPrice = session.prixCents ?? session.experience.prixCents;
    const total = unitPrice * input.nbPersonnes;
    if (total < 50 || total > 99_999_999) throw new ApiError(400, 'Montant incompatible avec un paiement par carte en euros');
    const { sessionId, nbPersonnes, nom, email, telephone, consentement } = input;
    const created = await tx.reservation.create({ data: { sessionId, nbPersonnes, nom, email, telephone: telephone ?? null, consentementLe: consentement, montantCents: total, checkoutKey: key } });
    const payload: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment', allowed_payment_method_types: ['card'], customer_email: email,
      client_reference_id: String(created.id), metadata: { reservationId: String(created.id) },
      expires_at: Math.floor((Date.now() + DUREE_BLOCAGE_MS) / 1000),
      success_url: `${origin}/reservation/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/reservation/annule`,
      line_items: [{ quantity: input.nbPersonnes, price_data: { currency: 'eur', unit_amount: unitPrice, product_data: { name: session.experience.titre } } }],
    };
    return tx.reservation.update({ where: { id: created.id }, data: { checkoutPayload: JSON.stringify(payload) } });
  });
  try {
    const checkout = await attachCheckout(reservation.id, stripe);
    if (checkout.status === 'expired') await applyStripeSession(checkout, 'checkout.session.expired');
    if (checkout.status !== 'open' || !checkout.url) throw new ApiError(409, 'Paiement déjà terminé ou expiré');
    return { reservationId: reservation.id, montantCents: reservation.montantCents, checkoutUrl: checkout.url };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'StripeInvalidRequestError') {
      await prisma.reservation.updateMany({ where: { id: reservation.id, statut: 'en_attente', stripeSessionId: null }, data: { statut: 'annulee' } });
      throw new ApiError(502, 'Stripe a refusé la création du paiement. Vérifiez sa configuration puis recommencez avec une nouvelle clé.');
    }
    // Un timeout peut masquer une création réussie chez Stripe : conserver le
    // blocage et réessayer avec la même clé, sans vendre à nouveau ces places.
    throw new ApiError(502, 'Stripe indisponible. Réessayez avec le même Idempotency-Key ; les places sont conservées en attendant confirmation.');
  }
}

/**
 * Applique un événement Stripe à la réservation. Renvoie son id uniquement si elle vient
 * de passer à « payée » (null sinon, y compris pour un événement répété) : c'est le signal
 * pour envoyer la confirmation, une seule fois.
 */
export async function applyStripeSession(checkout: Stripe.Checkout.Session, eventType: string): Promise<number | null> {
  const metadataId = checkout.metadata?.reservationId;
  if (!metadataId || !/^[1-9]\d*$/.test(metadataId)) return null;
  const id = Number(metadataId);
  if (!Number.isSafeInteger(id)) return null;
  return prisma.$transaction(async tx => {
    // Prendre d'abord un verrou d'écriture, puis relire l'état courant.
    await tx.reservation.updateMany({ where: { id }, data: { id } });
    const reservation = await tx.reservation.findUnique({ where: { id } });
    if (!reservation) return null;
    const invalidReference = reservation.checkoutKey
      ? checkout.client_reference_id !== String(id)
      : checkout.client_reference_id != null && checkout.client_reference_id !== String(id);
    if (checkout.livemode || checkout.mode !== 'payment' || invalidReference) throw new ApiError(400, 'Paiement incompatible');
    if (reservation.stripeSessionId && reservation.stripeSessionId !== checkout.id) throw new ApiError(409, 'Session Stripe différente de la réservation');
    if (reservation.statut !== 'en_attente') return null;
    if (eventType === 'checkout.session.expired') {
      if (checkout.status !== 'expired') throw new ApiError(400, 'Expiration invalide');
      await tx.reservation.update({ where: { id }, data: { statut: 'annulee', stripeSessionId: checkout.id } });
      return null;
    }
    if (eventType === 'checkout.session.async_payment_failed') {
      if (checkout.status !== 'complete' || checkout.payment_status !== 'unpaid') throw new ApiError(400, 'Échec de paiement invalide');
      await tx.reservation.update({ where: { id }, data: { statut: 'annulee', stripeSessionId: checkout.id } });
      return null;
    }
    if (checkout.payment_status !== 'paid' || checkout.status !== 'complete') return null;
    if (checkout.currency !== 'eur' || checkout.amount_total !== reservation.montantCents) throw new ApiError(400, 'Montant ou devise du paiement incorrect');
    const session = await lockSession(tx, reservation.sessionId);
    if (session.placesPrises + reservation.nbPersonnes > session.placesTotal) throw new ApiError(409, 'Capacité incohérente : intervention nécessaire');
    await tx.reservation.update({ where: { id }, data: { statut: 'payee', stripeSessionId: checkout.id } });
    await tx.session.update({ where: { id: session.id }, data: {
      placesPrises: { increment: reservation.nbPersonnes },
      ...(session.placesPrises + reservation.nbPersonnes === session.placesTotal ? { statut: 'complete' } : {}),
    } });
    return id;
  });
}

/**
 * Point d'entrée commun du webhook et de la page de succès : applique la session Stripe puis,
 * si la réservation vient d'être payée, envoie ses e-mails. Quel que soit celui des deux qui
 * arrive en premier, la confirmation et les e-mails n'ont lieu qu'une fois.
 */
export async function traiterSessionStripe(checkout: Stripe.Checkout.Session, eventType: string) {
  const payee = await applyStripeSession(checkout, eventType);
  if (payee) enArrierePlan(envoyerMailsReservationPayee(payee));
  return payee;
}

/** Ce qu'affiche la page de succès : jamais le nom, l'e-mail ni le téléphone. */
const champsApresPaiement = {
  id: true, nbPersonnes: true, montantCents: true, statut: true,
  session: { select: { dateDebut: true, lieu: true, experience: { select: { titre: true, slug: true } } } },
} as const;

export type ReservationApresPaiement = Prisma.ReservationGetPayload<{ select: typeof champsApresPaiement }>;

/**
 * Page de succès et GET /api/reservations?session_id= : sans compte, seul l'identifiant de session Stripe
 * de l'adresse de retour (connu du payeur) donne accès à la réservation. La session doit exister chez Stripe
 * (interrogé avec la clé secrète) et désigner cette réservation ; sinon rien n'est montré.
 * Si Stripe confirme le paiement, il est enregistré exactement comme par le webhook : une place payée
 * n'est donc pas libérée parce que le webhook arrive en retard (ou jamais).
 */
export async function reservationApresPaiement(
  stripeSessionId: string, stripe?: Stripe,
): Promise<{ reservation: ReservationApresPaiement } | { refus: 'introuvable' | 'indisponible' }> {
  if (!/^cs_test_[A-Za-z0-9]+$/.test(stripeSessionId)) return { refus: 'introuvable' };
  const reservation = await prisma.reservation.findUnique({ where: { stripeSessionId }, select: champsApresPaiement });
  if (!reservation) return { refus: 'introuvable' };

  let checkout: Stripe.Checkout.Session;
  try { checkout = await (stripe ?? configuredStripe()).checkout.sessions.retrieve(stripeSessionId); }
  catch (erreur) {
    // Session inconnue de Stripe : introuvable. Stripe injoignable ou non configuré : vérification impossible.
    const inconnue = erreur instanceof Error && erreur.name === 'StripeInvalidRequestError';
    return { refus: inconnue ? 'introuvable' : 'indisponible' };
  }
  const correspond = checkout.id === stripeSessionId && !checkout.livemode && checkout.metadata?.reservationId === String(reservation.id);
  if (!correspond) return { refus: 'introuvable' };

  if (reservation.statut === 'en_attente' && checkout.payment_status === 'paid' && checkout.status === 'complete') {
    try {
      if (await traiterSessionStripe(checkout, 'checkout.session.completed')) return { reservation: { ...reservation, statut: 'payee' } };
    } catch (erreur) {
      // Paiement incohérent (montant, devise) : on garde le statut de la base, à vérifier dans l'admin.
      console.error('Confirmation depuis la page de succès impossible :', erreur instanceof Error ? erreur.message : erreur);
    }
    const relue = await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id }, select: champsApresPaiement });
    return { reservation: relue };
  }
  return { reservation };
}
