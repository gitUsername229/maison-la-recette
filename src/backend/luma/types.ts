import { z } from 'zod';

// Formats des réponses de l'API Luma utilisées par le site, d'après la spécification officielle
// (https://public-api.luma.com/openapi.json, vérifiée le 8 octobre 2026) :
// - GET /v1/calendars/events/list → { entries: [événement + tags], has_more, next_cursor? } ;
// - GET /v1/events/get?event_id=evt-… → l'événement, avec sa description et ses organisateurs.
// Les schémas ne vérifient que les champs lus par le site ; les autres champs sont acceptés tels quels.

const adresse = z.object({
  address: z.string(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  city_state: z.string().nullable(),
  full_address: z.string().nullable(),
  google_maps_place_id: z.string().nullable(),
  apple_maps_place_id: z.string().nullable(),
  description: z.string().nullable(),
}).partial({ google_maps_place_id: true, apple_maps_place_id: true, description: true });

/** Champs communs d'un événement Luma. */
export const evenementSchema = z.looseObject({
  platform: z.string(),
  id: z.string(),
  calendar_id: z.string(),
  name: z.string(),
  start_at: z.string(),
  end_at: z.string(),
  duration_interval: z.string(),
  timezone: z.string(),
  url: z.string(),
  cover_url: z.string(),
  visibility: z.enum(['public', 'members-only', 'private']),
  location_type: z.string(),
  location_visibility: z.enum(['public', 'guests-only']),
  waitlist_status: z.enum(['disabled', 'enabled']),
  registration_open: z.boolean(),
  require_approval: z.boolean(),
  /** Places restantes avant d'atteindre la capacité ; null sans limite de capacité. */
  spots_remaining: z.number().nullable(),
  /** Prix de départ, en centimes (unité mineure de la devise), ou null si l'inscription est gratuite. */
  display_price: z.object({ amount: z.number(), currency: z.string(), is_flexible: z.boolean() }).nullable(),
  geo_address_json: adresse.nullable(),
});

export const entreeListeSchema = evenementSchema.extend({
  tags: z.array(z.object({ id: z.string(), name: z.string() })),
});

export const listeSchema = z.object({
  entries: z.array(z.unknown()),
  has_more: z.boolean(),
  next_cursor: z.string().optional(),
});

export const detailSchema = evenementSchema.extend({
  description: z.string(),
  description_md: z.string(),
  hosts: z.array(z.object({ id: z.string(), name: z.string().nullable(), avatar_url: z.string() })),
});

export type EvenementLuma = z.infer<typeof evenementSchema>;
export type EntreeListeLuma = z.infer<typeof entreeListeSchema>;
export type DetailEvenementLuma = z.infer<typeof detailSchema>;
