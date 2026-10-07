import Image from 'next/image';
import Link from 'next/link';
import ListeAvis, { type AvisAffiche } from '@/frontend/components/ListeAvis';
import { libelleType } from '@/frontend/format';
import { EnTeteExperiences, type TextesExperiences } from './experiences';

export type TextesEntreprises = TextesExperiences & Record<
  | 'entreprisesTitre' | 'entreprisesTexte' | 'formatsTitre' | 'etapesTitre'
  | 'etape1Titre' | 'etape1Texte' | 'etape2Titre' | 'etape2Texte' | 'etape3Titre' | 'etape3Texte'
  | 'avisTitre' | 'encartTitre' | 'bouton',
  string
>;

export type FormatEntreprise = { id: number; slug: string; type: string; titre: string; image: string; imageAlt: string };

const classeBoutonDevis = 'flex min-h-[51px] w-full max-w-[334px] items-center justify-center rounded-full bg-primaire px-6 text-lg tracking-[0.04em] text-sur-primaire hover:bg-primaire-fort';

/**
 * /experiences/entreprises (maquette « Frame 20 » et encart entreprises) : le sur-mesure, les formats en photos,
 * le déroulé (appel puis proposition sous 48 h), les avis, et le bouton « Obtenir un devis » dès le haut de page.
 */
export default function ExperiencesEntreprises({ textes, formats, avis }: { textes: TextesEntreprises; formats: FormatEntreprise[]; avis: AvisAffiche[] }) {
  const etapes = [
    [textes.etape1Titre, textes.etape1Texte], [textes.etape2Titre, textes.etape2Texte], [textes.etape3Titre, textes.etape3Texte],
  ];
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-6 lg:py-12">
      <EnTeteExperiences textes={textes} actif="entreprises" />

      <section className="mt-8 grid gap-4 lg:max-w-2xl">
        <h2 className="text-lg font-bold">{textes.entreprisesTitre}</h2>
        <p className="whitespace-pre-line">{textes.entreprisesTexte}</p>
        <Link href="/contact" className={classeBoutonDevis}>{textes.bouton}</Link>
      </section>

      {formats.length > 0 && (
        <section className="mt-12" aria-labelledby="formats">
          <h2 id="formats" className="text-2xl font-bold">{textes.formatsTitre}</h2>
          {/* Défilement horizontal sur mobile, grille sur ordinateur ; chaque photo mène au devis avec l'expérience choisie. */}
          <ul className="-mx-5 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
            {formats.map(format => (
              <li key={format.id} className="w-[82%] shrink-0 snap-start lg:w-auto">
                <Link href={`/contact?experience=${format.slug}`} className="group relative block aspect-[5/3] overflow-hidden rounded-xl bg-fond-doux">
                  {format.image && <Image src={format.image} alt={format.imageAlt} fill sizes="(min-width: 1024px) 30vw, 82vw" className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />}
                  <span className="absolute left-3 top-3 rounded-full border border-decor bg-surface px-2.5 py-1 text-xs font-bold text-texte">{libelleType(format.type)}</span>
                  <span className="absolute inset-x-0 bottom-0 bg-voile/45 px-4 py-3 font-bold text-sur-fond-sombre backdrop-blur-[4px]">
                    {format.titre}<span className="sr-only"> : demander un devis</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 rounded-xl bg-fond-doux p-6 sm:p-8" aria-labelledby="deroule">
        <h2 id="deroule" className="text-2xl font-bold">{textes.etapesTitre}</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {etapes.map(([titre, texte], i) => (
            <li key={titre} className="grid content-start gap-2">
              <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-primaire text-lg font-bold text-sur-primaire">{i + 1}</span>
              <h3 className="text-lg font-bold">{titre}</h3>
              <p className="whitespace-pre-line text-texte-doux">{texte}</p>
            </li>
          ))}
        </ol>
      </section>

      <ListeAvis avis={avis} titre={textes.avisTitre} />

      <section className="mt-14 grid justify-items-center gap-5 rounded-xl bg-pastel-chaud px-6 py-10 text-center">
        <p className="max-w-md whitespace-pre-line text-lg font-bold">{textes.encartTitre}</p>
        <Link href="/contact" className={classeBoutonDevis}>{textes.bouton}</Link>
      </section>
    </main>
  );
}
