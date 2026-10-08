import { z } from 'zod';
import { TYPES_EPISODE } from '@/backend/podcast/emission';
import { CATEGORIE_PAR_DEFAUT, CLES_CATEGORIES } from './categories-blog';

// Chaque ressource a un schéma de base SANS valeur par défaut :
// - création = base + valeurs par défaut ;
// - modification = base.partial(), qui n'écrase donc jamais un champ absent
//   (avec zod 4, .partial() appliquerait sinon les valeurs par défaut).

const texte = (max = 500) => z.string().trim().min(1).max(max);
const date = z.string().refine(v => !isNaN(Date.parse(v)), 'Date invalide').transform(v => new Date(v));
const lien = z.httpUrl().max(1000);
const slug = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Minuscules, chiffres et tirets uniquement');

/** Chemin d'une image locale (/images/…), ou vide. */
export const cheminImage = z.string().max(500).refine(v => v === '' || (/^\/images\/[\w/.-]+$/.test(v) && !v.includes('..')), 'Chemin d’image invalide (attendu : /images/…)');

/** Chemin d'une page du site, ex : /a-propos ou /experiences/atelier-cuisine-anti-gaspi. */
const page = z.string().max(200).regex(/^\/[\w/-]*$/, 'Chemin de page invalide (ex : /a-propos)');

const identifiant = z.number().int().positive();

// Un article peut renvoyer vers un épisode et vers des expériences (blocs en bas de l'article).
const article = z.object({
  slug: slug.refine(v => v !== 'categorie', 'Adresse réservée aux catégories du blog : choisissez-en une autre.'),
  titre: texte(), extrait: texte(), contenu: texte(100_000),
  image: cheminImage, imageAlt: z.string().trim().max(500), datePublication: date, publie: z.boolean(),
  categorie: z.enum(CLES_CATEGORIES),
  episodeId: identifiant.nullable(),
  experienceIds: z.array(identifiant).max(20).transform(ids => [...new Set(ids)]),
}).strict();
export const articleSchemas = {
  creation: article.extend({
    datePublication: date.optional(), publie: z.boolean().default(false),
    categorie: article.shape.categorie.default(CATEGORIE_PAR_DEFAUT), episodeId: article.shape.episodeId.default(null),
    experienceIds: article.shape.experienceIds.default([]),
  }),
  modification: article.partial(),
};

// « demo » n'est pas modifiable : seuls les avis fictifs du seed le portent.
const avis = z.object({
  nom: texte(120), citation: texte(2000), contexte: texte(),
  note: z.number().int().min(1).max(5).nullable(), date: date.nullable(), visible: z.boolean(),
}).strict();
export const avisSchemas = {
  creation: avis.extend({ note: avis.shape.note.optional(), date: avis.shape.date.optional(), visible: z.boolean().default(true) }),
  modification: avis.partial(),
};

const partenaire = z.object({
  nom: texte(120), metier: texte(120), photo: cheminImage, photoAlt: z.string().trim().max(500),
  description: texte(5000), visible: z.boolean(),
}).strict();
export const partenaireSchemas = {
  // Masqué par défaut : affiché seulement après l'accord du partenaire.
  creation: partenaire.extend({ visible: z.boolean().default(false) }),
  modification: partenaire.partial(),
};

const episode = z.object({
  saison: z.number().int().min(1).max(100), numero: z.number().int().min(0).max(10_000),
  titre: texte(), description: texte(20_000), resume: z.string().trim().max(5000), type: z.enum(TYPES_EPISODE), invite: texte(200).nullable(),
  datePublication: date, dureeMin: z.number().int().min(1).max(1000),
  image: z.union([lien, cheminImage]), embedUrl: lien, audioUrl: lien.nullable(),
  spotifyUrl: lien.nullable(), deezerUrl: lien.nullable(), appleUrl: lien.nullable(), youtubeUrl: lien.nullable(),
}).strict();
export const episodeSchemas = {
  creation: episode.extend({
    saison: z.number().int().min(1).max(100).default(1), resume: z.string().trim().max(5000).default(''), type: z.enum(TYPES_EPISODE).default('complet'),
    invite: episode.shape.invite.optional(), audioUrl: lien.nullable().optional(), spotifyUrl: lien.nullable().optional(), deezerUrl: lien.nullable().optional(),
    appleUrl: lien.nullable().optional(), youtubeUrl: lien.nullable().optional(),
  }),
  modification: episode.partial(),
};

const image = z.object({
  url: cheminImage.refine(v => v !== '', 'Image obligatoire'), alt: texte(), page, ordre: z.number().int().min(0).max(10_000),
}).strict();
export const imageSchemas = {
  creation: image.extend({ ordre: z.number().int().min(0).max(10_000).default(0) }),
  modification: image.partial(),
};
