import 'server-only';
import { evenementsLuma, type EvenementAffiche } from '@/backend/luma/client';
import { EXPERIENCES, type Experience } from '@/contenu/experiences';
import { GALERIES_EXPERIENCES } from '@/contenu/photos';

// Expériences (src/contenu/experiences.ts) et leurs dates, lues dans le calendrier Luma de la cliente.

export const experienceParSlug = (slug: string) => EXPERIENCES.find(e => e.slug === slug) ?? null;

/** Expérience d'un événement Luma : celle dont l'étiquette (tag Luma) est portée par l'événement, sans tenir compte des majuscules. */
export function experienceDe(evenement: EvenementAffiche): Experience | null {
  const etiquettes = evenement.etiquettes.map(e => e.toLowerCase());
  return EXPERIENCES.find(x => x.reservation === 'luma' && x.etiquetteLuma && etiquettes.includes(x.etiquetteLuma.toLowerCase())) ?? null;
}

/** Événements d'une expérience (aucun pour une expérience sur devis). */
export const evenementsDe = (experience: Experience, evenements: EvenementAffiche[]) =>
  experience.reservation === 'luma' ? evenements.filter(e => experienceDe(e)?.slug === experience.slug) : [];

/** Expérience, sa galerie et ses prochains événements Luma (null : Luma illisible, lien de secours). */
export async function experienceAvecDates(slug: string) {
  const experience = experienceParSlug(slug);
  if (!experience) return null;
  const evenements = experience.reservation === 'luma' ? await evenementsLuma('a-venir') : [];
  return { experience, galerie: GALERIES_EXPERIENCES[slug] ?? [], evenements: evenements && evenementsDe(experience, evenements) };
}

/** Cartes de l'accueil : chaque expérience avec sa prochaine date Luma et le nombre d'autres dates. */
export async function cartesExperiences() {
  const evenements = await evenementsLuma('a-venir');
  return EXPERIENCES.map(experience => {
    const [prochaine, ...autres] = evenementsDe(experience, evenements ?? []);
    return { ...experience, prochaineDate: prochaine ?? null, autresDates: autres.length };
  });
}

/** Expériences liées à un article (par slug), avec leurs prochaines dates Luma. */
export async function experiencesAvecProchainesDates(slugs: string[], nombreDeDates = 3) {
  const liees = slugs.flatMap(slug => experienceParSlug(slug) ?? []);
  const evenements = liees.some(e => e.reservation === 'luma') ? await evenementsLuma('a-venir') : [];
  return liees.map(experience => ({ ...experience, prochainesDates: evenementsDe(experience, evenements ?? []).slice(0, nombreDeDates) }));
}

/** Photos des expériences (galeries, puis couvertures), sans doublon : mosaïque « Pour les entreprises ». */
export function photosDesExperiences(nombre = 4) {
  const photos = [
    ...EXPERIENCES.flatMap(e => GALERIES_EXPERIENCES[e.slug] ?? []),
    ...EXPERIENCES.filter(e => e.image).map(e => ({ url: e.image, alt: e.imageAlt })),
  ];
  return photos.filter((photo, i) => photos.findIndex(p => p.url === photo.url) === i).slice(0, nombre);
}
