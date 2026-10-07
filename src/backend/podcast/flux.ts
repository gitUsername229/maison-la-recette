import 'server-only';
import { decodeHTML } from 'entities';
import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { DEBUTS_TEXTE_COMMUN, lecteurAusha, REGLES_TYPE, type TypeEpisode } from './emission';

/** Un épisode tel que lu dans le flux RSS Ausha, prêt à enregistrer. */
export type EpisodeDuFlux = {
  guid: string;
  titre: string;
  description: string;
  resume: string;
  type: TypeEpisode;
  saison: number;
  numero: number;
  datePublication: Date;
  dureeMin: number;
  image: string;
  embedUrl: string;
  audioUrl: string;
};

const parseur = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: 'valeur',
  parseTagValue: false, // tout reste du texte : « 01:28 » ou « 07 » ne sont pas convertis
  htmlEntities: true,
  isArray: nom => nom === 'item',
});

// Une balise répétée devient un tableau : on garde la première occurrence.
const premier = <T extends z.ZodType>(schema: T) => z.preprocess(v => (Array.isArray(v) ? v[0] : v), schema);
const texte = premier(z.union([z.string(), z.object({ valeur: z.string() }).transform(n => n.valeur)]));
const image = premier(z.object({ href: z.string() })).optional();

const itemSchema = z.object({
  title: texte,
  guid: texte,
  pubDate: texte,
  description: texte.default(''),
  enclosure: premier(z.object({ url: z.string() })),
  'itunes:duration': texte.optional(),
  'itunes:season': texte.optional(),
  'itunes:episode': texte.optional(),
  'itunes:episodeType': texte.optional(),
  'itunes:image': image,
});
type Item = z.infer<typeof itemSchema>;

const fluxSchema = z.object({
  rss: z.object({ channel: z.object({ item: z.array(z.unknown()).default([]), 'itunes:image': image }) }),
});

// Émojis (affichés en image par défaut, ou demandés par le sélecteur U+FE0F), avec leurs suites (teinte, ZWJ),
// drapeaux et touches numérotées. Les symboles typographiques (©, ™, ★, →) ne sont pas touchés.
const EMOJI = /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F)(?:[\u{1F3FB}-\u{1F3FF}]|\uFE0F)*(?:\u200D(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F?)(?:[\u{1F3FB}-\u{1F3FF}]|\uFE0F)*)*|[\u{1F1E6}-\u{1F1FF}]{2}|[#*0-9]\uFE0F?\u20E3/gu;

/** Retire les émojis d'un texte venu d'Ausha (le site n'en affiche pas) et les espaces qu'ils laissent. */
export function sansEmojis(texte: string) {
  return texte.replace(EMOJI, '').replace(/[\uFE0F\u200D]/g, '').replace(/^[ \t]+/gm, '').replace(/[ \t]{2,}/g, ' ').trim();
}

/** HTML d'une description → texte brut sans émojis, paragraphes conservés (affiché ensuite comme du texte, jamais comme du HTML). */
export function texteDepuisHtml(html: string) {
  const texteBrut = html.replace(/<br\s*\/?>|<\/(p|li|h\d)>/gi, '\n').replace(/<[^>]+>/g, '');
  return sansEmojis(decodeHTML(texteBrut)).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Extrait affiché : la description sans le texte commun de fin (crédits, soutien, réseaux, mention Ausha). */
export function resumeDepuisDescription(description: string) {
  let position = 0;
  for (const ligne of description.split('\n')) {
    const debut = ligne.replace(/^[^\p{L}\p{N}]+/u, ''); // ignore les symboles en début de ligne
    if (DEBUTS_TEXTE_COMMUN.some(rx => rx.exec(debut)?.index === 0)) return description.slice(0, position).trim();
    position += ligne.length + 1;
  }
  return description;
}

export function typeDepuisTitre(titre: string, typeAusha?: string): TypeEpisode {
  const regle = REGLES_TYPE.find(r => r.titre.test(titre));
  if (regle) return regle.type;
  return typeAusha === 'trailer' ? 'extrait' : 'complet'; // la bande-annonce de l'émission
}

/** « 53:18 », « 1:02:03 » ou « 3198 » (secondes) → minutes, au moins 1. */
export function dureeEnMinutes(duree = '') {
  const secondes = duree.split(':').reduce((total, partie) => total * 60 + Number(partie), 0);
  return Number.isFinite(secondes) && secondes > 0 ? Math.max(1, Math.round(secondes / 60)) : 1;
}

const entier = (valeur?: string) => Number.parseInt(valeur ?? '', 10) || 0;

function episodeDepuisItem(item: Item, imageParDefaut: string): EpisodeDuFlux | null {
  const idAudio = /audio\.ausha\.co\/([A-Za-z0-9]+)\.mp3/.exec(item.enclosure.url)?.[1];
  const datePublication = new Date(item.pubDate);
  if (!idAudio || Number.isNaN(datePublication.getTime())) return null;
  const titre = sansEmojis(item.title);
  const description = texteDepuisHtml(item.description);
  return {
    guid: item.guid.trim(),
    titre,
    description,
    resume: resumeDepuisDescription(description),
    type: typeDepuisTitre(titre, item['itunes:episodeType']),
    saison: entier(item['itunes:season']) || 1,
    numero: entier(item['itunes:episode']), // 0 : pas de numéro dans le flux
    datePublication,
    dureeMin: dureeEnMinutes(item['itunes:duration']),
    image: item['itunes:image']?.href ?? imageParDefaut,
    embedUrl: lecteurAusha(idAudio),
    audioUrl: item.enclosure.url,
  };
}

/** Lit le flux RSS Ausha. Un épisode illisible est ignoré (et signalé), sans bloquer les autres. */
export function lireFlux(xml: string): EpisodeDuFlux[] {
  const brut: unknown = parseur.parse(xml);
  const { channel } = fluxSchema.parse(brut).rss;
  const imageParDefaut = channel['itunes:image']?.href ?? '';
  return channel.item.flatMap(element => {
    const item = itemSchema.safeParse(element);
    const episode = item.success ? episodeDepuisItem(item.data, imageParDefaut) : null;
    if (!episode) console.warn('[podcast] épisode ignoré : flux incomplet pour', item.success ? item.data.title : 'un élément');
    return episode ? [episode] : [];
  });
}
