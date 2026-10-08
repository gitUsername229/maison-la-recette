import type { ReactNode } from 'react';
import Image from 'next/image';
import Icone from '@/frontend/components/Icone';

type Props = { titre: string; liens: readonly { plateforme: string; url: string }[]; className?: string };

// Logos des plateformes (fichiers de la maquette) : couleurs de la marque, sauf Apple Podcasts, logo monochrome
// affiché dans la couleur du texte (pas de noir pur). Une plateforme sans logo n'affiche que son nom.
const LOGOS: Record<string, ReactNode> = {
  Spotify: <Image src="/images/plateformes/spotify.svg" alt="" width={24} height={24} unoptimized />,
  Deezer: <Image src="/images/plateformes/deezer.svg" alt="" width={24} height={24} unoptimized />,
  'Apple Podcasts': <Icone nom="apple-podcasts" taille={24} />,
};

/** Plateformes d'écoute de l'émission (src/backend/podcast/emission.ts), en pastilles cerclées avec leur logo (maquette). */
export default function LiensEcoute({ titre, liens, className = '' }: Props) {
  return (
    <div className={className}>
      <p className="text-sm font-bold">{titre}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {liens.map(lien => (
          <li key={lien.url}>
            <a href={lien.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold ring-2 ring-texte hover:bg-fond">
              {LOGOS[lien.plateforme]}
              {lien.plateforme}<span className="sr-only"> (nouvel onglet)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
