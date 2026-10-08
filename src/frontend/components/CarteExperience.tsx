import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { textePlaces, textePrix, type DateLuma } from '@/frontend/components/ProchainesDates';
import { formatDateHeure, formatDuree, libelleType } from '@/frontend/format';
import { classeEtiquetteType, classeGrandBouton } from '@/frontend/styles/classes';

/** Ce qu'une carte affiche d'une expérience (src/contenu/experiences.ts). */
export type ExperienceCarte = {
  slug: string; type: string; titre: string; image: string; imageAlt: string; lieu: string | null; dureeMin: number;
  reservation: 'luma' | 'devis';
};

export type CarteExperienceDonnees = ExperienceCarte & { prochaineDate: DateLuma | null; autresDates: number };

/** Événement Luma et l'expérience qui porte son étiquette (null : événement sans expérience reconnue). */
export type EvenementCarte = DateLuma & { fin: Date | string; experience: ExperienceCarte | null };

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Photo des événements sans expérience reconnue. */
const PHOTO_PAR_DEFAUT = { url: '/images/demo/tablee-plein-air.jpg', alt: 'Une longue tablée dressée dans un jardin' };

type Contenu = {
  image: string; imageAlt: string; type?: string; places?: string | null; titre: string; lienTitre?: string;
  lignes: [string, string][];
  action: { href: string; texte: string; style: 'primaire' | 'secondaire'; externe?: boolean };
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
        <ul className="absolute inset-x-3 bottom-3 flex flex-wrap gap-2">
          {type && <li className={classeEtiquetteType(type)}>{libelleType(type)}</li>}
          {places && <li className="rounded-full bg-fond px-3 py-1 text-xs font-bold">{places}</li>}
        </ul>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-titre text-2xl leading-tight text-titre">
          {lienTitre ? <Link href={lienTitre} className="underline-offset-4 hover:underline">{titre}</Link> : titre}
        </h3>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {lignes.map(([terme, valeur]) => <Fragment key={terme}><dt className="font-bold">{terme}</dt><dd>{valeur}</dd></Fragment>)}
        </dl>
        <div className="mt-auto pt-5">
          {action.externe ? (
            <a href={action.href} target="_blank" rel="noopener noreferrer" className={classeGrandBouton[action.style]}>
              {action.texte}<span className="sr-only"> : {titre} (nouvel onglet)</span>
            </a>
          ) : (
            <Link href={action.href} className={classeGrandBouton[action.style]}>
              {action.texte}<span className="sr-only"> : {titre}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

const dureeEntre = (debut: Date | string, fin: Date | string) => Math.round((new Date(fin).getTime() - new Date(debut).getTime()) / 60_000);

/**
 * Expérience (accueil) : sa prochaine date Luma s'il y en a, sinon « Prochaines dates bientôt » ou « Sur devis » ;
 * bouton « En savoir plus » vers sa page.
 */
export default function CarteExperience({ experience }: { experience: CarteExperienceDonnees }) {
  const { slug, type, titre, image, imageAlt, lieu, dureeMin, reservation, prochaineDate, autresDates } = experience;
  const lignes: [string, string][] = [
    ['Date', reservation === 'devis' ? 'Sur devis' : prochaineDate ? `${formatDateHeure(prochaineDate.debut)}${autresDates ? ` (+ ${pluriel(autresDates, 'autre date')})` : ''}` : 'Prochaines dates bientôt'],
    ['Lieu', prochaineDate?.lieu ?? lieu ?? 'À définir ensemble'],
    ['Durée', formatDuree(dureeMin)],
    ['Prix', reservation === 'devis' ? 'Sur devis' : prochaineDate ? textePrix(prochaineDate.prix) : 'Annoncé avec les dates'],
  ];
  return (
    <Carte
      image={image} imageAlt={imageAlt} type={type} titre={titre} lignes={lignes}
      places={prochaineDate && textePlaces(prochaineDate.placesRestantes)}
      action={{ href: `/experiences/${slug}`, texte: 'En savoir plus', style: 'primaire' }}
    />
  );
}

/** Événement Luma à venir (page Expériences) : titre vers la page de l'expérience, bouton « Réserver sur Luma ». */
export function CarteEvenement({ evenement }: { evenement: EvenementCarte }) {
  const { experience } = evenement;
  const photo = experience ? { url: experience.image, alt: experience.imageAlt } : PHOTO_PAR_DEFAUT;
  return (
    <Carte
      image={photo.url} imageAlt={photo.alt} type={experience?.type} titre={evenement.titre}
      lienTitre={experience ? `/experiences/${experience.slug}` : undefined}
      places={textePlaces(evenement.placesRestantes)}
      lignes={[
        ['Date', formatDateHeure(evenement.debut)],
        ...(evenement.lieu ? [['Lieu', evenement.lieu] as [string, string]] : []),
        ['Durée', formatDuree(dureeEntre(evenement.debut, evenement.fin))],
        ['Prix', textePrix(evenement.prix)],
      ]}
      action={{ href: evenement.url, texte: 'Réserver sur Luma', style: 'primaire', externe: true }}
    />
  );
}

/** Expérience sur devis (immersions, entreprises) : bouton « Demander un devis », l'expérience déjà choisie. */
export function CarteSurDevis({ experience }: { experience: ExperienceCarte }) {
  return (
    <Carte
      image={experience.image} imageAlt={experience.imageAlt} type={experience.type} titre={experience.titre}
      lienTitre={`/experiences/${experience.slug}`}
      lignes={[['Lieu', experience.lieu ?? 'À définir ensemble'], ['Durée', formatDuree(experience.dureeMin)], ['Prix', 'Sur devis']]}
      action={{ href: `/contact?experience=${experience.slug}`, texte: 'Demander un devis', style: 'primaire' }}
    />
  );
}

/** Événement passé (maquette : sans prix, bouton orange « En savoir plus » vers l'expérience, sinon vers Luma). */
export function CarteEvenementPasse({ evenement }: { evenement: EvenementCarte }) {
  const { experience } = evenement;
  const photo = experience ? { url: experience.image, alt: experience.imageAlt } : PHOTO_PAR_DEFAUT;
  return (
    <Carte
      image={photo.url} imageAlt={photo.alt} type={experience?.type} titre={evenement.titre}
      lignes={[
        ['Date', formatDateHeure(evenement.debut)],
        ...(evenement.lieu ? [['Lieu', evenement.lieu] as [string, string]] : []),
        ['Durée', formatDuree(dureeEntre(evenement.debut, evenement.fin))],
      ]}
      action={experience
        ? { href: `/experiences/${experience.slug}`, texte: 'En savoir plus', style: 'secondaire' }
        : { href: evenement.url, texte: 'Voir sur Luma', style: 'secondaire', externe: true }}
    />
  );
}
