import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/backend/db/prisma";
import { getStripe } from "@/backend/payments/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhook
 * Appelée par Stripe (en local : stripe listen --forward-to localhost:3000/api/webhook).
 * - checkout.session.completed : réservation "payee" et places mises à jour
 * - checkout.session.expired   : réservation "annulee" (places libérées)
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Signature ou secret manquant" }, { status: 400 });
  }

  // Le corps doit rester brut (texte) pour que la signature soit vérifiable
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error("Signature webhook invalide :", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const checkout = event.data.object as Stripe.Checkout.Session;
        if (checkout.payment_status === "paid") {
          await confirmerReservation(checkout);
        }
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const checkout = event.data.object as Stripe.Checkout.Session;
        await prisma.reservation.updateMany({
          where: { stripeSessionId: checkout.id, statut: "en_attente" },
          data: { statut: "annulee" },
        });
        break;
      }
      default:
        // Les autres événements sont ignorés
        break;
    }
  } catch (err) {
    console.error(`Erreur lors du traitement de ${event.type} :`, err);
    // Code 500 : Stripe renverra l'événement plus tard
    return NextResponse.json({ error: "Erreur de traitement" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function confirmerReservation(checkout: Stripe.Checkout.Session) {
  const reservationId = Number(checkout.metadata?.reservationId);

  await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findFirst({
      where: Number.isInteger(reservationId)
        ? { id: reservationId }
        : { stripeSessionId: checkout.id },
    });

    // Déjà traitée : Stripe peut envoyer le même événement plusieurs fois
    if (!reservation || reservation.statut === "payee") return;

    await tx.reservation.update({
      where: { id: reservation.id },
      data: { statut: "payee", stripeSessionId: checkout.id },
    });

    const session = await tx.session.update({
      where: { id: reservation.sessionId },
      data: { placesPrises: { increment: reservation.nbPersonnes } },
    });

    if (session.placesPrises >= session.placesTotal) {
      await tx.session.update({
        where: { id: session.id },
        data: { statut: "complete" },
      });
    }
  });

  // TODO : envoyer l'e-mail de confirmation au client et à Julie (Nodemailer + Mailpit)
}
