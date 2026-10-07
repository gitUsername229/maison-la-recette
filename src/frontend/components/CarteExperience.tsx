import Image from 'next/image';
import Link from 'next/link';
import Icone from '@/frontend/components/Icone';
import { formatDateHeure, libelleType } from '@/frontend/format';

export type CarteExperienceDonnees = {
  id: number; slug: string; type: string; titre: string; image: string; imageAlt: string;
  prochaineDate: { dateDebut: Date; placesRestantes: number } | null; // vide : sur devis
  autresDates: number;
};

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/**
 * Carte d'une expérience (maquette « Frame 18 ») : photo, bandeau flouté avec le titre, le type, les places et la
 * prochaine date ; en bas, « En savoir plus » et l'inscription, ou la demande de devis s'il n'y a pas de date ouverte.
 */
export default function CarteExperience({ experience }: { experience: CarteExperienceDonnees }) {
  const { id, slug, type, titre, image, imageAlt, prochaineDate, autresDates } = experience;
  return (
    <article className="group relative isolate flex aspect-[362/509] flex-col justify-between overflow-hidden rounded-xl bg-fond-doux text-sur-fond-sombre">
      {image && (
        <Image src={image} alt={imageAlt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="-z-10 object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />
      )}
      <div className="bg-voile/45 px-6 py-5 backdrop-blur-[5px]">
        <h2 className="text-xl font-bold">{titre}</h2>
        <ul className="mt-3 flex flex-wrap gap-2.5 text-xs font-bold">
          <li className="rounded-full border border-decor bg-surface px-2.5 py-1 text-texte">{libelleType(type)}</li>
          {prochaineDate && (
            <li className="rounded-full border border-texte bg-succes-fond px-2.5 py-1 text-texte">{pluriel(prochaineDate.placesRestantes, 'place')} {prochaineDate.placesRestantes > 1 ? 'restantes' : 'restante'}</li>
          )}
        </ul>
        <p className="mt-3 flex items-center gap-2 text-xs font-bold">
          <Icone nom="calendrier" taille={15} />
          {prochaineDate ? formatDateHeure(prochaineDate.dateDebut) : 'Sur devis'}
        </p>
        {autresDates > 0 && <p className="mt-1 text-xs">+ {pluriel(autresDates, 'autre date')}</p>}
      </div>
      <div className="flex items-center justify-between gap-3 bg-voile/35 px-6 py-4 backdrop-blur-[4px]">
        <Link href={`/experiences/${slug}`} className="text-sm font-bold underline underline-offset-4">
          En savoir plus<span className="sr-only"> : {titre}</span>
        </Link>
        <Link
          href={prochaineDate ? `/experiences/${slug}#reserver` : `/contact?experience=${id}`}
          className="flex min-h-[51px] items-center gap-2.5 rounded-full bg-primaire px-5 text-lg font-bold text-sur-primaire hover:bg-primaire-fort"
        >
          {prochaineDate ? 'Inscriptions' : 'Demander un devis'}
          <span className="sr-only"> : {titre}</span>
          <Icone nom="fleche-droite" taille={24} />
        </Link>
      </div>
    </article>
  );
}
