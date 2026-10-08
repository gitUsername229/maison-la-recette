import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDateHeure, formatDuree, formatPrix, libelleType } from '@/frontend/format';
import { classeGrandBouton } from '@/frontend/styles/classes';

export type CarteExperienceDonnees = {
  id: number; slug: string; type: string; titre: string; image: string; imageAlt: string; lieu: string | null; dureeMin: number;
  prochaineDate: { dateDebut: Date; placesRestantes: number; lieu: string; prixCents: number } | null; // vide : sur devis
  autresDates: number;
};

export type SessionPassee = {
  id: number; dateDebut: Date; lieu: string;
  experience: { slug: string; type: string; titre: string; image: string; imageAlt: string; dureeMin: number };
};

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Étiquette du type sur la photo (maquette : atelier en orange, good tour en vert foncé). */
const TEINTE_TYPE: Record<string, string> = { atelier: 'bg-secondaire text-sur-secondaire', good_tour: 'bg-fond-sombre text-sur-fond-sombre' };

type Contenu = {
  image: string; imageAlt: string; type: string; places?: string; titre: string; lienTitre?: string;
  lignes: [string, string][]; action: { href: string; texte: string; style: 'primaire' | 'secondaire' };
};

/** Carte de la maquette : photo et étiquettes, puis titre, Date / Lieu / Durée / Prix et un bouton. */
function Carte({ image, imageAlt, type, places, titre, lienTitre, lignes, action }: Contenu) {
  return (
    <article className="zone-claire group flex h-full flex-col overflow-hidden rounded-2xl bg-fond text-texte">
      <div className="relative aspect-[16/9] overflow-hidden bg-pastel">
        {image && (
          <Image src={image} alt={imageAlt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 60vw, 85vw"
            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" />
        )}
        <ul className="absolute inset-x-3 bottom-3 flex flex-wrap gap-2 text-xs font-bold">
          <li className={`rounded-full px-3 py-1 ${TEINTE_TYPE[type] ?? 'bg-pastel text-texte'}`}>{libelleType(type)}</li>
          {places && <li className="rounded-full bg-fond px-3 py-1">{places}</li>}
        </ul>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-2xl font-bold leading-tight">
          {lienTitre ? <Link href={lienTitre} className="underline-offset-4 hover:underline">{titre}</Link> : titre}
        </h3>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {lignes.map(([terme, valeur]) => <Fragment key={terme}><dt className="font-bold">{terme}</dt><dd>{valeur}</dd></Fragment>)}
        </dl>
        <div className="mt-auto pt-5">
          <Link href={action.href} className={classeGrandBouton[action.style]}>
            {action.texte}<span className="sr-only"> : {titre}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Expérience à venir. « reserver » (page Expériences) : bouton Réserver, ou Demander un devis sans date ouverte,
 * et titre vers la page de l'expérience ; « decouvrir » (accueil) : bouton En savoir plus.
 */
export default function CarteExperience({ experience, action }: { experience: CarteExperienceDonnees; action: 'reserver' | 'decouvrir' }) {
  const { slug, type, titre, image, imageAlt, lieu, dureeMin, prochaineDate, autresDates } = experience;
  const page = `/experiences/${slug}`;
  const lignes: [string, string][] = [
    ...(prochaineDate ? [['Date', `${formatDateHeure(prochaineDate.dateDebut)}${autresDates ? ` (+ ${pluriel(autresDates, 'autre date')})` : ''}`] as [string, string]] : []),
    ['Lieu', prochaineDate?.lieu ?? lieu ?? 'À définir ensemble'],
    ['Durée', formatDuree(dureeMin)],
    ['Prix', prochaineDate ? `${formatPrix(prochaineDate.prixCents)} par personne` : 'Sur devis'],
  ];
  const bouton = action === 'decouvrir'
    ? { href: page, texte: 'En savoir plus' }
    : prochaineDate ? { href: `${page}#reserver`, texte: 'Réserver' } : { href: `/contact?experience=${slug}`, texte: 'Demander un devis' };
  return (
    <Carte
      image={image} imageAlt={imageAlt} type={type} titre={titre} lignes={lignes}
      lienTitre={action === 'reserver' ? page : undefined}
      places={prochaineDate ? `${pluriel(prochaineDate.placesRestantes, 'place')} ${prochaineDate.placesRestantes > 1 ? 'restantes' : 'restante'}` : undefined}
      action={{ ...bouton, style: 'primaire' }}
    />
  );
}

/** Expérience passée (maquette : sans prix, bouton orange En savoir plus). */
export function CarteSessionPassee({ session }: { session: SessionPassee }) {
  const { experience } = session;
  return (
    <Carte
      image={experience.image} imageAlt={experience.imageAlt} type={experience.type} titre={experience.titre}
      lignes={[['Date', formatDateHeure(session.dateDebut)], ['Lieu', session.lieu], ['Durée', formatDuree(experience.dureeMin)]]}
      action={{ href: `/experiences/${experience.slug}`, texte: 'En savoir plus', style: 'secondaire' }}
    />
  );
}
