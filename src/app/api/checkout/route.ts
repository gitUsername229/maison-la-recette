import { NextResponse } from "next/server";
import { prisma } from "@/backend/db/prisma";
import { getStripe } from "@/backend/payments/stripe";
import { placesDisponibles, DUREE_BLOCAGE_MS } from "@/backend/places";

export const runtime = "nodejs";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/checkout
 * Corps : { sessionId, nom, email, telephone?, nbPersonnes }
 * Crée une réservation "en_attente" puis une session Stripe Checkout.
 * Réponse : { reservationId, montantCents, checkoutUrl }
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const sessionId = Number(body.sessionId);
  const nbPersonnes = Number(body.nbPersonnes);
  const nom = String(body.nom ?? "").trim();
  const email = String(body.email ?? "").trim();
  const telephone = body.telephone ? String(body.telephone).trim() : null;

  // 1. Validation des champs
  if (!Number.isInteger(sessionId)) {
    return NextResponse.json({ error: "sessionId manquant" }, { status: 400 });
  }
  if (!Number.isInteger(nbPersonnes) || nbPersonnes < 1) {
    return NextResponse.json({ error: "nbPersonnes doit être supérieur à 0" }, { status: 400 });
  }
  if (!nom) {
    return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
  }

  // 2. Vérifie la session et bloque les places (transaction = pas de double réservation)
  const resultat = await prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: { id: sessionId },
      include: { experience: true },
    });

    if (!session) {
      return { erreur: "Session introuvable", status: 404 } as const;
    }
    if (!session.experience.reservableEnLigne) {
      return { erreur: "Cette expérience se réserve sur devis", status: 400 } as const;
    }
    if (session.statut !== "ouverte" || session.dateDebut < new Date()) {
      return { erreur: "Cette session n'est plus réservable", status: 409 } as const;
    }

    const restantes = await placesDisponibles(tx, sessionId);
    if (nbPersonnes > restantes) {
      const message =
        restantes <= 0
          ? "Cette session est complète"
          : `Il ne reste que ${restantes} place${restantes > 1 ? "s" : ""}`;
      return { erreur: message, status: 409 } as const;
    }

    const prixUnitaire = session.prixCents ?? session.experience.prixCents;
    const reservation = await tx.reservation.create({
      data: {
        sessionId,
        nom,
        email,
        telephone,
        nbPersonnes,
        montantCents: prixUnitaire * nbPersonnes,
        statut: "en_attente",
      },
    });

    return { reservation, session, prixUnitaire } as const;
  });

  if ("erreur" in resultat) {
    return NextResponse.json({ error: resultat.erreur }, { status: resultat.status });
  }

  const { reservation, session, prixUnitaire } = resultat;

  // 3. Crée la session de paiement Stripe
  try {
    const dateLisible = session.dateDebut.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    const checkout = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          quantity: nbPersonnes,
          price_data: {
            currency: "eur",
            unit_amount: prixUnitaire,
            product_data: {
              name: session.experience.titre,
              description: `${dateLisible}, ${session.lieu}`,
            },
          },
        },
      ],
      metadata: { reservationId: String(reservation.id) },
      expires_at: Math.floor((Date.now() + DUREE_BLOCAGE_MS) / 1000),
      success_url: `${BASE_URL}/reservation/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/reservation/annule?reservation_id=${reservation.id}`,
    });

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { stripeSessionId: checkout.id },
    });

    return NextResponse.json({
      reservationId: reservation.id,
      montantCents: reservation.montantCents,
      checkoutUrl: checkout.url,
    });
  } catch (err) {
    // Stripe a échoué : on libère les places
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { statut: "annulee" },
    });
    console.error("Erreur Stripe :", err);
    return NextResponse.json(
      { error: "Le paiement n'a pas pu être lancé. Réessayez dans un instant." },
      { status: 502 }
    );
  }
}
