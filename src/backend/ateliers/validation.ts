import { z } from 'zod';

const text = z.string().trim().min(1).max(500);
const money = z.number().int().min(0).max(10_000_000);
const positive = z.number().int().min(1).max(10_000);
export const experienceSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  type: z.enum(['atelier', 'good_tour', 'immersion']),
  titre: text, accroche: text, description: z.string().trim().min(1).max(30_000),
  dureeMin: positive, prixCents: money, prixEntrepriseCents: money.nullable().optional(),
  capaciteMax: positive, lieu: text.nullable().optional(),
  image: z.string().max(500).refine(v => v === '' || /^\/images\/[\w/.-]+$/.test(v) && !v.includes('..')),
  imageAlt: z.string().trim().max(500), actif: z.boolean().default(true),
  reservableEnLigne: z.boolean().default(true),
}).strict();
export const sessionSchema = z.object({
  experienceId: z.number().int().positive(),
  dateDebut: z.iso.datetime({ offset: true }).transform(v => new Date(v)),
  dateFin: z.iso.datetime({ offset: true }).transform(v => new Date(v)),
  lieu: text, placesTotal: positive,
  prixCents: money.nullable().optional(),
  statut: z.enum(['ouverte', 'complete', 'annulee']).default('ouverte'),
}).strict();
// Nom, e-mail et téléphone viennent du compte connecté, jamais du formulaire.
export const checkoutSchema = z.object({
  sessionId: z.number().int().positive(), nbPersonnes: positive,
}).strict();
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export const experienceUpdateSchema = experienceSchema.omit({ actif: true, reservableEnLigne: true }).partial().extend({ actif: z.boolean().optional(), reservableEnLigne: z.boolean().optional() });
export const sessionUpdateSchema = sessionSchema.omit({ experienceId: true, statut: true }).partial().extend({ statut: z.enum(['ouverte', 'complete', 'annulee']).optional() });
export const cancellationSchema = z.object({ statut: z.literal('annulee') }).strict();

// Nom et e-mail viennent du compte ; le téléphone aussi, sauf si le compte n'en a pas.
export const TYPES_DEVIS = ['experience', 'sponsoring', 'studio', 'evenement'] as const;
export const LIEUX_DEVIS = ['dans_les_locaux', 'a_proximite'] as const;
export const devisSchema = z.object({
  entreprise: text,
  telephone: z.string().trim().min(6).max(40).optional(),
  typeDemande: z.enum(TYPES_DEVIS),
  experienceId: z.number().int().positive().optional(), nbParticipants: positive.optional(),
  dateSouhaitee: z.string().refine(v => /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v) && !isNaN(Date.parse(v))).transform(v => new Date(v)).optional(),
  lieuSouhaite: z.enum(LIEUX_DEVIS).optional(),
  message: z.string().trim().min(1).max(10_000),
}).strict();
export type DevisInput = z.infer<typeof devisSchema>;
