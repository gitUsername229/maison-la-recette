'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Icone from '@/frontend/components/Icone';
import LecteurAusha from '@/frontend/components/LecteurAusha';
import TexteRepliable from '@/frontend/components/TexteRepliable';
import { formatDate } from '@/frontend/format';

export type EpisodeLecteur = {
  id: number; titre: string; invite: string | null; resume: string; datePublication: string; dureeMin: number;
  image: string; embedUrl: string; audioUrl: string | null;
};

type Props = {
  episodes: EpisodeLecteur[];                // la saison affichée, la plus récente d'abord
  lecteur: 'sur-mesure' | 'ausha';           // réglage LECTEUR_PODCAST (src/backend/podcast/emission.ts)
};

/** 754 s → « 12:34 » */
const duree = (secondes: number) => {
  const s = Math.max(0, Math.floor(secondes));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const defiler = (element: HTMLElement | null) =>
  element?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

/**
 * Lecteur de la maquette (écran « Frame 15 ») : l'épisode en cours en grand (pochette, précédent, lecture, suivant,
 * progression), puis la liste de la saison, chaque épisode avec son bouton lecture. Le son vient du fichier audio
 * du flux Ausha ; en réglage « ausha », ou sans fichier audio, le lecteur intégré d'Ausha le remplace.
 */
export default function LecteurPodcast({ episodes, lecteur }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const carte = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [enLecture, setEnLecture] = useState(false);
  const [position, setPosition] = useState(0);
  const [total, setTotal] = useState(0);

  const episode = episodes[index];
  if (!episode) return null;
  const surMesure = lecteur === 'sur-mesure' && Boolean(episode.audioUrl);
  const totalAffiche = total || episode.dureeMin * 60;

  function choisir(nouvelIndex: number, lancer: boolean) {
    if (nouvelIndex < 0 || nouvelIndex >= episodes.length) return;
    setIndex(nouvelIndex);
    setPosition(0);
    setTotal(0);
    setEnLecture(lancer);
    // Le nouvel épisode démarre une fois sa source chargée (voir onLoadedMetadata).
  }

  function basculer() {
    const element = audio.current;
    if (!element) return;
    if (element.paused) element.play().catch(() => setEnLecture(false));
    else element.pause();
  }

  return (
    <div className="grid gap-8">
      <section ref={carte} aria-label="Épisode en cours" className="scroll-mt-24 rounded-xl bg-fond-doux px-6 pb-8 pt-5 text-texte">
        <h2 className="text-lg font-bold">{episode.titre}</h2>
        {episode.invite && <p className="text-xs font-bold">avec {episode.invite}</p>}
        <p className="mt-3 flex items-center gap-2 text-xs font-bold">
          <Icone nom="calendrier" taille={15} />
          {formatDate(episode.datePublication)} · {episode.dureeMin} min
        </p>
        <Image src={episode.image} alt="" width={181} height={181} className="mx-auto mt-5 h-[181px] w-[181px] rounded-md object-cover" />

        {surMesure ? (
          <>
            <audio
              ref={audio}
              src={episode.audioUrl ?? undefined}
              preload="metadata"
              onLoadedMetadata={e => { setTotal(e.currentTarget.duration); if (enLecture) e.currentTarget.play().catch(() => setEnLecture(false)); }}
              onTimeUpdate={e => setPosition(e.currentTarget.currentTime)}
              onPlay={() => setEnLecture(true)}
              onPause={() => setEnLecture(false)}
              onEnded={() => choisir(index + 1, true)}
            />
            <div className="mt-6 flex items-center justify-center gap-8 text-primaire">
              <button type="button" onClick={() => choisir(index - 1, enLecture)} disabled={index === 0} aria-label="Épisode précédent" className="disabled:opacity-40">
                <Icone nom="suivant" taille={32} className="-scale-x-100" />
              </button>
              <button type="button" onClick={basculer} aria-label={enLecture ? 'Pause' : 'Lecture'} className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-primaire text-sur-primaire hover:bg-primaire-fort">
                {enLecture
                  ? <span aria-hidden="true" className="flex gap-1.5"><span className="h-5 w-1.5 rounded-sm bg-current" /><span className="h-5 w-1.5 rounded-sm bg-current" /></span>
                  : <Icone nom="lecture" taille={26} />}
              </button>
              <button type="button" onClick={() => choisir(index + 1, enLecture)} disabled={index === episodes.length - 1} aria-label="Épisode suivant" className="disabled:opacity-40">
                <Icone nom="suivant" taille={32} />
              </button>
            </div>
            <input
              type="range" min={0} max={Math.max(1, Math.round(totalAffiche))} step={1} value={Math.round(position)}
              onChange={e => { if (audio.current) audio.current.currentTime = Number(e.target.value); }}
              aria-label="Position dans l’épisode"
              aria-valuetext={`${duree(position)} sur ${duree(totalAffiche)}`}
              className="curseur-lecture mt-6 w-full"
              style={{ '--progression': `${totalAffiche ? (position / totalAffiche) * 100 : 0}%` } as React.CSSProperties}
            />
            <p className="flex justify-between text-xs" aria-hidden="true"><span>{duree(position)}</span><span>{duree(totalAffiche)}</span></p>
          </>
        ) : (
          <div className="mt-6 grid">
            <LecteurAusha key={episode.id} url={episode.embedUrl} titre={episode.titre} />
          </div>
        )}
        {episode.resume && <div className="mt-6"><TexteRepliable texte={episode.resume} /></div>}
      </section>

      <ul className="grid gap-5">
        {episodes.map((e, i) => (
          <li key={e.id} aria-current={i === index ? 'true' : undefined} className={`flex items-center gap-3 rounded-xl p-3 sm:gap-4 sm:p-4 ${i === index ? 'bg-pastel' : 'bg-fond-doux'}`}>
            <Image src={e.image} alt="" width={102} height={102} className="h-20 w-20 shrink-0 rounded-md object-cover sm:h-[102px] sm:w-[102px]" />
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-3 font-bold leading-snug" title={e.titre}>{e.titre}</h3>
              {e.invite && <p className="text-xs font-bold">avec {e.invite}</p>}
              <p className="mt-1 text-xs text-texte-doux">{formatDate(e.datePublication)} · {e.dureeMin} min</p>
            </div>
            <button
              type="button"
              onClick={() => { if (i === index) audio.current?.play().catch(() => setEnLecture(false)); else choisir(i, true); defiler(carte.current); }}
              aria-label={`Écouter : ${e.titre}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-texte ring-1 ring-bordure hover:bg-pastel sm:h-[65px] sm:w-[65px]"
            >
              <Icone nom="lecture-petit" taille={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
