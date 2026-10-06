import 'server-only';
import Stripe from 'stripe';

let stripe: Stripe | undefined;

/** Instanciation à la demande : le site peut démarrer sans clés Stripe. */
export function getStripe(): Stripe {
  if (stripe) return stripe;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret?.startsWith('sk_test_') || secret === 'sk_test_xxx') {
    throw new Error('Configurer STRIPE_SECRET_KEY avec une clé Stripe sandbox.');
  }
  stripe = new Stripe(secret);
  return stripe;
}
