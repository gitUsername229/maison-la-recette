import Image from 'next/image';
import Link from 'next/link';
import Galerie, { type PhotoGalerie } from '@/frontend/components/Galerie';
import ListeAvis, { type AvisAffiche } from '@/frontend/components/ListeAvis';
import { classeGrandBouton, classeSurtitre } from '@/frontend/styles/classes';

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
    <main className="mx-auto max-w-4xl px-5 py-8 lg:px-6 lg:py-12">
      <p className={classeSurtitre}>{textes.surtitre}</p>
      <h1 className="mt-4 text-4xl font-bold">{textes.titre}</h1>
      <p className="mt-6 whitespace-pre-line text-lg leading-relaxed">{textes.introduction}</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {[
          { titre: textes.experiencesTitre, texte: textes.experiencesTexte, bouton: textes.experiencesBouton, href: '/experiences' },
          { titre: textes.podcastTitre, texte: textes.podcastTexte, bouton: textes.podcastBouton, href: '/podcast' },
        ].map(bloc => (
          <div key={bloc.href} className="flex flex-col rounded-2xl bg-fond p-6">
            <h2 className="text-2xl font-bold">{bloc.titre}</h2>
            <p className="mt-2 whitespace-pre-line">{bloc.texte}</p>
            <Link href={bloc.href} className={`mt-6 ${classeGrandBouton.contour}`}>{bloc.bouton}</Link>
          </div>
        ))}
      </div>

      {partenaires.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold">{textes.partenairesTitre}</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {partenaires.map(p => (
              <li key={p.id} className="flex gap-4 rounded-2xl bg-fond p-5">
                {p.photo && <Image src={p.photo} alt={p.photoAlt} width={96} height={96} className="h-24 w-24 shrink-0 rounded-xl object-cover" />}
                <div>
                  <p className="text-lg font-bold">{p.nom}</p>
                  <p className="text-sm">{p.metier}</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-texte-doux">{p.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-14"><ListeAvis avis={avis} titre={textes.avisTitre} /></div>
      <Galerie photos={photos} titre={textes.galerieTitre} />
    </main>
  );
}
