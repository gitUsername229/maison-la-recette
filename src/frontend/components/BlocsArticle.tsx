import Image from 'next/image';
import Link from 'next/link';
import LecteurAusha from '@/frontend/components/LecteurAusha';
import ProchainesDates, { type DateOuverte } from '@/frontend/components/ProchainesDates';
import { formatDate } from '@/frontend/format';

// Blocs sous un article : ils mènent le lecteur vers le podcast, les expériences ou une demande de devis.

export type EpisodeLie = { titre: string; datePublication: Date; image: string; embedUrl: string };
export type ExperienceLiee = { id: number; slug: string; titre: string; accroche: string; reservableEnLigne: boolean; prochainesDates: DateOuverte[] };

const classeBloc = 'mt-12 rounded-2xl bg-white p-6 ring-1 ring-stone-200 sm:p-8';
const classeLien = 'text-sm font-semibold text-amber-800 hover:underline';

type TextesEpisode = { titre: string; bouton: string; lien: string };

export function BlocEpisode({ episode, textes }: { episode: EpisodeLie; textes: TextesEpisode }) {
  return (
    <section className={classeBloc} aria-labelledby="bloc-episode">
      <h2 id="bloc-episode" className="font-serif text-2xl">{textes.titre}</h2>
      <div className="mt-4 flex items-start gap-4">
        {episode.image && <Image src={episode.image} alt="" width={80} height={80} className="h-20 w-20 shrink-0 rounded-xl object-cover" />}
        <div>
          <p className="font-medium text-stone-900">{episode.titre}</p>
          <p className="text-sm text-stone-500">{formatDate(episode.datePublication)}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <LecteurAusha url={episode.embedUrl} titre={episode.titre} libelle={textes.bouton} />
        <Link href="/podcast" className={classeLien}>{textes.lien} →</Link>
      </div>
    </section>
  );
}

type TextesExperiences = { titre: string; texte: string; bouton: string };

/** Expériences liées et leurs prochaines dates ; sans lien, une invitation à découvrir toutes les expériences. */
export function BlocExperiences({ experiences, textes }: { experiences: ExperienceLiee[]; textes: TextesExperiences }) {
  return (
    <section className={classeBloc} aria-labelledby="bloc-experiences">
      <h2 id="bloc-experiences" className="font-serif text-2xl">{textes.titre}</h2>
      {experiences.length === 0 ? (
        <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-600">{textes.texte}</p>
      ) : (
        <ul className="mt-5 grid gap-6 sm:grid-cols-2">
          {experiences.map(experience => (
            <li key={experience.id} className="grid content-start gap-3">
              <div>
                <Link href={`/experiences/${experience.slug}`} className="font-serif text-xl hover:underline">{experience.titre}</Link>
                <p className="mt-1 text-sm text-stone-600">{experience.accroche}</p>
              </div>
              {experience.reservableEnLigne ? (
                <>
                  <ProchainesDates sessions={experience.prochainesDates} />
                  <Link href={`/experiences/${experience.slug}`} className={classeLien}>Voir les dates et réserver →</Link>
                </>
              ) : (
                <Link href={`/contact?experience=${experience.id}`} className={classeLien}>Sur devis : demander une date →</Link>
              )}
            </li>
          ))}
        </ul>
      )}
      <Link href="/experiences" className={`${classeLien} mt-6 inline-block`}>{textes.bouton} →</Link>
    </section>
  );
}

type TextesDevis = { titre: string; texte: string; bouton: string };

/** Encadré des articles pour les entreprises : vers le formulaire de devis, l'expérience liée déjà choisie. */
export function AppelDevis({ experienceId, textes }: { experienceId?: number; textes: TextesDevis }) {
  return (
    <section className="mt-12 rounded-2xl bg-encre p-6 text-creme sm:p-8" aria-labelledby="bloc-devis">
      <h2 id="bloc-devis" className="font-serif text-2xl">{textes.titre}</h2>
      <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-200">{textes.texte}</p>
      <Link href={experienceId ? `/contact?experience=${experienceId}` : '/contact'} className="mt-5 inline-flex rounded-full bg-creme px-5 py-3 font-medium text-encre hover:bg-white">
        {textes.bouton}
      </Link>
    </section>
  );
}
