import 'server-only';

// L'émission « la recette » de Julie Van Ossel : seul fichier à modifier si un lien
// d'écoute ou la mise en forme des descriptions Ausha change.

export const TYPES_EPISODE = ['complet', 'extrait', 'replay'] as const;
export type TypeEpisode = (typeof TYPES_EPISODE)[number];

/** Liens de l'émission, vérifiés sur le smartlink officiel (smartlink.ausha.co/la-recette) le 6 octobre 2026. */
export const LIENS_EMISSION = [
  { plateforme: 'Toutes les plateformes', url: 'https://smartlink.ausha.co/la-recette' },
  { plateforme: 'Apple Podcasts', url: 'https://podcasts.apple.com/us/podcast/la-recette/id1673916177' },
  { plateforme: 'Spotify', url: 'https://open.spotify.com/show/78p9jKRzpoGWQ2sTCfBOof' },
  { plateforme: 'Deezer', url: 'https://www.deezer.com/show/5771417' },
  { plateforme: 'YouTube', url: 'https://www.youtube.com/@Larecettepodcast' },
] as const;

/**
 * Lecteur de la page /podcast : « sur-mesure » (maquette : le site lit le fichier audio du flux) ou « ausha »
 * (lecteur intégré d'Ausha, si la cliente préfère ses statistiques d'écoute). C'est le seul réglage à changer.
 */
export const LECTEUR_PODCAST: 'sur-mesure' | 'ausha' = 'sur-mesure';

/** Lecteur Ausha intégrable d'un épisode (l'identifiant est le nom du fichier audio dans le flux). */
export const lecteurAusha = (idAudio: string) =>
  `https://player.ausha.co/?podcastId=${encodeURIComponent(idAudio)}&display=horizontal&v=2`;

/**
 * Type d'un épisode, déduit de son titre à l'import (modifiable ensuite dans l'admin).
 * Le type « full / bonus » fourni par Ausha ne correspond pas aux titres : il n'est pas utilisé.
 */
export const REGLES_TYPE: { type: TypeEpisode; titre: RegExp }[] = [
  { type: 'replay', titre: /^\s*(replay|rediffusion)\b/i },     // « REPLAY - … », « REDIFFUSION - … »
  { type: 'extrait', titre: /^\s*\[?\s*(extrait|teaser)\b/i },  // « [EXTRAIT 2 - …] », « EXTRAIT - … », « TEASER - … »
];

/**
 * Les descriptions finissent par un texte commun (crédits, soutien, réseaux, mention Ausha) qui
 * commence par l'une de ces lignes. L'extrait affiché (resume) s'arrête avant la première trouvée.
 */
export const DEBUTS_TEXTE_COMMUN: RegExp[] = [
  /production,?\s+r[ée]alisation/i,
  /musique\s*:/i,
  /habillage sonore/i,
  /pour soutenir ce podcast/i,
  /envie de changer le monde/i,
  /la recette est un podcast ind[ée]pendant/i,
  /h[ée]berg[ée] par ausha/i,
];
