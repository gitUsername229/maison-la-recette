import Image from 'next/image';
import Link from 'next/link';
import Galerie, { type PhotoGalerie } from '@/frontend/components/Galerie';
import ProchainesDates, { textePrix, type DateLuma } from '@/frontend/components/ProchainesDates';
import { formatDuree, libelleType } from '@/frontend/format';
import { classeEtiquetteType, classeGrandBouton } from '@/frontend/styles/classes';

export type ExperienceDetail = {
  slug: string;
  type: string;
  titre: string;
  accroche: string;
  description: string;
  dureeMin: number;
  lieu: string | null;
  image: string;
  imageAlt: string;
  reservation: 'luma' | 'devis';
};

type Props = {
  experience: ExperienceDetail;
  galerie: PhotoGalerie[];
  dates: DateLuma[] | null;                   // prochains événements Luma de l'expérience ; null : Luma illisible
};

/** Prix affiché : le moins cher des prochains événements Luma, « Sur devis », ou annoncé avec les dates. */
function prixAffiche({ reservation }: ExperienceDetail, dates: DateLuma[] | null) {
  if (reservation === 'devis') return 'Sur devis';
  const [moinsCher] = (dates ?? []).flatMap(d => (d.prix ? [d.prix] : [])).toSorted((a, b) => a.centimes - b.centimes);
  if (moinsCher) return `À partir de ${textePrix(moinsCher)}`;
  return dates?.length ? 'Gratuit' : 'Annoncé avec les dates';
}

/**
 * Page d'une expérience : présentation, galerie et, à côté, ses prochaines dates Luma (« Réserver sur Luma ») ou,
 * pour une expérience sur devis, la demande de devis.
 */
export default function Experience({ experience, galerie, dates }: Props) {
  return (
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-6 lg:py-12">
      <Link href="/experiences" className="text-sm underline-offset-4 hover:underline">← Toutes les expériences</Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_24rem]">
        <article>
          <p className={`w-fit ${classeEtiquetteType(experience.type)}`}>{libelleType(experience.type)}</p>
          <h1 className="mt-3 font-titre text-4xl text-titre">{experience.titre}</h1>
          <p className="mt-5 text-lg leading-relaxed">{experience.accroche}</p>
          {experience.image && <Image src={experience.image} alt={experience.imageAlt} width={1200} height={750} priority className="mt-8 aspect-[16/10] w-full rounded-2xl object-cover" />}

          {/* Mêmes informations que les cartes de la maquette : Lieu / Durée / Prix. */}
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-2xl bg-fond p-5 text-sm">
            <dt className="font-bold">Lieu</dt>
            <dd>{experience.lieu ?? 'Précisé à l’inscription'}</dd>
            <dt className="font-bold">Durée</dt>
            <dd>{formatDuree(experience.dureeMin)}</dd>
            <dt className="font-bold">Prix</dt>
            <dd>{prixAffiche(experience, dates)}</dd>
          </dl>

          <p className="mt-8 whitespace-pre-line leading-relaxed">{experience.description}</p>
          <Galerie photos={galerie} />
        </article>

        <aside id="reserver" className="h-fit scroll-mt-24 rounded-2xl bg-fond p-6">
          {experience.reservation === 'luma' ? (
            <>
              <h2 className="font-titre text-2xl text-titre">Prochaines dates</h2>
              <p className="mb-5 mt-1 text-sm text-texte-doux">Inscription et paiement sur Luma.</p>
              <ProchainesDates dates={dates} />
            </>
          ) : (
            <>
              <h2 className="font-titre text-2xl text-titre">Sur devis</h2>
              <p className="mt-3 leading-relaxed">
                Cette expérience se prépare avec vous : date, groupe et programme sont définis ensemble.
              </p>
              <Link href={`/contact?experience=${experience.slug}`} className={`mt-6 ${classeGrandBouton.primaire}`}>
                Demander un devis
              </Link>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
