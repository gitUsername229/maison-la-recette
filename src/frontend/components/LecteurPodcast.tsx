'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Icone from '@/frontend/components/Icone';
import LecteurAusha from '@/frontend/components/LecteurAusha';
import TexteRepliable from '@/frontend/components/TexteRepliable';
import { decouperTitre, formatDate } from '@/frontend/format';

export type EpisodeLecteur = {
  id: number; titre: string; invite: string | null; resume: string; datePublication: string; dureeMin: number;
  image: string; embedUrl: string; audioUrl: string | null;
};

type Props = {
  episodes: EpisodeLecteur[];                // la saison affichée, la plus récente d'abord
  lecteur: 'sur-mesure' | 'ausha';           // réglage LECTEUR_PODCAST (src/backend/podcast/emission.ts)
  etiquette?: string;                        // pastille au-dessus de l'épisode (accueil : « Extrait du dernier épisode »)
  liste?: boolean;                           // la liste des épisodes sous le lecteur (page podcast)
  niveau?: 'h2' | 'h3';                      // niveau du titre de l'épisode en cours
};

/** 754 s → « 12:34 » */
const duree = (secondes: number) => {
  const s = Math.max(0, Math.floor(secondes));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const defiler = (element: HTMLElement | null) =>
  element?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

function Pause({ taille }: { taille: 'petite' | 'grande' }) {
  const barre = taille === 'grande' ? 'h-5 w-1.5' : 'h-4 w-1';
  return <span aria-hidden="true" className="flex gap-1"><span className={`${barre} rounded-sm bg-current`} /><span className={`${barre} rounded-sm bg-current`} /></span>;
}

/** Invité (saisi dans l'admin, sinon lu dans le titre) et sujet de l'épisode. */
const titres = (episode: EpisodeLecteur) => (episode.invite ? { nom: episode.invite, sujet: episode.titre } : decouperTitre(episode.titre));

const classeSaut = 'h-10 rounded-full px-4 text-sm ring-1 ring-texte hover:bg-fond-doux';

/**
 * Lecteur de la maquette : l'épisode en cours dans une carte blanche (pochette, invité, sujet, date, progression,
 * −15 s, lecture, +30 s), puis la liste de la saison, chaque épisode avec son bouton lecture. Le son vient du fichier
 * audio du flux Ausha ; en réglage « ausha », ou sans fichier audio, le lecteur intégré d'Ausha le remplace.
 */
export default function LecteurPodcast({ episodes, lecteur, etiquette, liste = true, niveau: Titre = 'h2' }: Props) {
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
  const { nom, sujet } = titres(episode);

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

  function sauter(secondes: number) {
    const element = audio.current;
    if (element) element.currentTime = Math.min(Math.max(0, element.currentTime + secondes), element.duration || totalAffiche);
  }

  return (
    <div className="grid gap-5">
      <section ref={carte} aria-label="Épisode en cours" className="scroll-mt-24 rounded-2xl bg-fond p-5 text-texte">
        {etiquette && <p className="mb-4 w-fit rounded-full bg-fond-sombre px-3 py-1 text-xs font-bold text-sur-fond-sombre">{etiquette}</p>}
        <div className="flex gap-4">
          <Image src={episode.image} alt="" width={96} height={96} className="h-24 w-24 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <Titre className="text-2xl leading-tight">{nom}</Titre>
            {sujet && <p className="mt-1 line-clamp-3 text-sm leading-snug">{sujet}</p>}
            <p className="mt-2 flex items-center gap-2 text-xs">
              <Icone nom="calendrier" taille={15} />
              {formatDate(episode.datePublication)}
            </p>
          </div>
        </div>

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
            <input
              type="range" min={0} max={Math.max(1, Math.round(totalAffiche))} step={1} value={Math.round(position)}
              onChange={e => { if (audio.current) audio.current.currentTime = Number(e.target.value); }}
              aria-label="Position dans l’épisode"
              aria-valuetext={`${duree(position)} sur ${duree(totalAffiche)}`}
              className="curseur-lecture mt-5 w-full"
              style={{ '--progression': `${totalAffiche ? (position / totalAffiche) * 100 : 0}%` } as React.CSSProperties}
            />
            <p className="flex justify-between text-xs" aria-hidden="true"><span>{duree(position)}</span><span>−{duree(totalAffiche - position)}</span></p>
            <div className="mt-3 flex items-center justify-center gap-5">
              <button type="button" onClick={() => sauter(-15)} aria-label="Reculer de 15 secondes" className={classeSaut}>−15 s</button>
              <button type="button" onClick={basculer} aria-label={enLecture ? 'Pause' : 'Lecture'} className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-primaire text-sur-primaire hover:bg-primaire-fort">
                {enLecture ? <Pause taille="grande" /> : <Icone nom="lecture" taille={26} />}
              </button>
              <button type="button" onClick={() => sauter(30)} aria-label="Avancer de 30 secondes" className={classeSaut}>+30 s</button>
            </div>
          </>
        ) : (
          <div className="mt-5 grid">
            <LecteurAusha key={episode.id} url={episode.embedUrl} titre={episode.titre} />
          </div>
        )}
        {/* Résumé (rempli à l'import, modifiable dans l'admin) : page podcast seulement, replié. */}
        {liste && episode.resume && <div className="mt-5 border-t border-bordure pt-4"><TexteRepliable texte={episode.resume} seuil={200} /></div>}
      </section>

      {liste && (
        <ul className="grid gap-4">
          {episodes.map((e, i) => {
            const enCours = i === index;
            const { nom: nomEpisode, sujet: sujetEpisode } = titres(e);
            return (
              <li key={e.id} aria-current={enCours ? 'true' : undefined} className="flex items-center gap-3 rounded-2xl bg-fond p-3 sm:gap-4 sm:p-4">
                <Image src={e.image} alt="" width={88} height={88} className="h-[72px] w-[72px] shrink-0 rounded-lg object-cover sm:h-[88px] sm:w-[88px]" />
                <div className="min-w-0 flex-1">
                  <p className="flex w-fit items-center gap-1.5 rounded-full bg-pastel px-2.5 py-0.5 text-xs">
                    <Icone nom="calendrier" taille={13} />
                    {formatDate(e.datePublication)}
                  </p>
                  <h3 className="mt-1 font-bold leading-snug">{nomEpisode}</h3>
                  {sujetEpisode && <p className="line-clamp-2 text-sm leading-snug" title={sujetEpisode}>{sujetEpisode}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!enCours) { choisir(i, true); defiler(carte.current); } else if (surMesure) basculer();
                    else defiler(carte.current);
                  }}
                  aria-label={`${enCours && enLecture ? 'Pause' : 'Écouter'} : ${e.titre}`}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primaire text-sur-primaire hover:bg-primaire-fort"
                >
                  {enCours && enLecture ? <Pause taille="petite" /> : <Icone nom="lecture-petit" taille={18} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
