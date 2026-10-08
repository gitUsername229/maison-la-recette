import { z } from 'zod';
import { consentement } from '@/backend/anti-spam';

const text = z.string().trim().min(1).max(500);
const positive = z.number().int().min(1).max(10_000);
// Coordonnées saisies par le visiteur (il n'y a pas de compte client).
const nom = z.string().trim().min(1).max(120);
const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const telephone = z.string().trim().min(6).max(40);

export const checkoutSchema = z.object({
  sessionId: z.number().int().positive(), nbPersonnes: positive,
  nom, email, telephone: telephone.optional(), consentement,
}).strict();
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const TYPES_DEVIS = ['experience', 'sponsoring', 'studio', 'evenement'] as const;
export const LIEUX_DEVIS = ['dans_les_locaux', 'a_proximite'] as const;
// Demande de devis : téléphone obligatoire, Julie rappelle avant de répondre.
export const devisSchema = z.object({
  nom, entreprise: text, email, telephone,
  typeDemande: z.enum(TYPES_DEVIS),
  experienceId: z.number().int().positive().optional(), nbParticipants: positive.optional(),
  dateSouhaitee: z.string().refine(v => /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v) && !isNaN(Date.parse(v))).transform(v => new Date(v)).optional(),
  lieuSouhaite: z.enum(LIEUX_DEVIS).optional(),
  message: z.string().trim().min(1).max(10_000),
  consentement,
}).strict();
export type DevisInput = z.infer<typeof devisSchema>;
