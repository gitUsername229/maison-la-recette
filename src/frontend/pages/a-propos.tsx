import Image from 'next/image';
import Link from 'next/link';
import Galerie, { type PhotoGalerie } from '@/frontend/components/Galerie';
import ListeAvis, { type AvisAffiche } from '@/frontend/components/ListeAvis';

export type PartenaireAffiche = { id: number; nom: string; metier: string; photo: string; photoAlt: string; description: string };

/** Textes de la page « À propos », modifiables dans /admin/textes. */
export type TextesAPropos = Record<
  | 'surtitre' | 'titre' | 'introduction'
  | 'experiencesTitre' | 'experiencesTexte' | 'experiencesBouton' | 'podcastTitre' | 'podcastTexte' | 'podcastBouton'
  | 'partenairesTitre' | 'avisTitre' | 'galerieTitre',
  string
>;

type Props = { textes: TextesAPropos; partenaires: PartenaireAffiche[]; avis: AvisAffiche[]; photos: PhotoGalerie[] };

export default function APropos({ textes, partenaires, avis, photos }: Props) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <span className="rounded-full bg-pastel px-3 py-1 text-xs font-semibold uppercase tracking-wider text-texte-doux">
        {textes.surtitre}
      </span>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl text-texte">
        {textes.titre}
      </h1>
      <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-texte-doux">
        {textes.introduction}
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl bg-pastel p-7">
          <h2 className="font-serif text-2xl">{textes.experiencesTitre}</h2>
          <p className="mt-2 whitespace-pre-line text-texte-doux">
            {textes.experiencesTexte}
          </p>
          <Link href="/experiences" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
            {textes.experiencesBouton} →
          </Link>
        </div>
        <div className="rounded-3xl bg-pastel-chaud p-7">
          <h2 className="font-serif text-2xl">{textes.podcastTitre}</h2>
          <p className="mt-2 whitespace-pre-line">
            {textes.podcastTexte}
          </p>
          <Link href="/podcast" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
            {textes.podcastBouton} →
          </Link>
        </div>
      </div>

      {partenaires.length > 0 && (
        <section className="mt-14">
          <h2 className="font-serif text-2xl">{textes.partenairesTitre}</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {partenaires.map(p => (
              <li key={p.id} className="flex gap-4 rounded-2xl border border-bordure bg-surface p-5">
                {p.photo && <Image src={p.photo} alt={p.photoAlt} width={96} height={96} className="h-24 w-24 shrink-0 rounded-xl object-cover" />}
                <div>
                  <p className="font-serif text-lg">{p.nom}</p>
                  <p className="text-sm text-texte-doux">{p.metier}</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-texte-doux">{p.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ListeAvis avis={avis} titre={textes.avisTitre} />
      <Galerie photos={photos} titre={textes.galerieTitre} />
    </main>
  );
}
