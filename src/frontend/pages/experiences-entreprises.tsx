import Link from 'next/link';
import ListeAvis, { type AvisAffiche } from '@/frontend/components/ListeAvis';
import MosaiquePhotos, { type PhotoMosaique } from '@/frontend/components/MosaiquePhotos';
import { classeGrandBouton } from '@/frontend/styles/classes';
import { EnTeteExperiences, type TextesExperiences } from './experiences';

export type TextesEntreprises = TextesExperiences & Record<'entreprisesIntroduction' | 'boutonDevis', string>;

/**
 * /experiences/entreprises (maquette) : la présentation du sur-mesure, une mosaïque de photos des expériences,
 * « Demander un devis », puis les témoignages en carrousel. Les logos clients de la maquette (« Ils me font
 * confiance ») attendent leurs fichiers.
 */
export default function ExperiencesEntreprises({ textes, photos, avis }: { textes: TextesEntreprises; photos: PhotoMosaique[]; avis: AvisAffiche[] }) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-6 lg:py-12">
      <EnTeteExperiences textes={textes} actif="entreprises" />

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-x-12">
        <p className="whitespace-pre-line leading-relaxed lg:self-end lg:text-lg">{textes.entreprisesIntroduction}</p>
        {photos.length > 0 && <MosaiquePhotos photos={photos} className="-mx-5 lg:row-span-2 lg:mx-0" />}
        <Link href="/contact" className={`${classeGrandBouton.primaire} lg:max-w-[334px] lg:self-start`}>{textes.boutonDevis}</Link>
      </div>

      {avis.length > 0 && <div className="mt-12"><ListeAvis avis={avis} notes={false} /></div>}
    </main>
  );
}
