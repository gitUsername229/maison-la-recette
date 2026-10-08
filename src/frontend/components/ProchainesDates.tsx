import { LIEN_LUMA } from '@/contenu/liens';
import { formatDateHeure, formatPrix } from '@/frontend/format';
import { classeGrandBouton } from '@/frontend/styles/classes';

/** Événement Luma tel qu'affiché (dates, lieu, prix, places), avec le lien de sa page d'inscription Luma. */
export type DateLuma = {
  id: string; titre: string; debut: Date | string; lieu: string | null;
  prix: { centimes: number; devise: string } | null; placesRestantes: number | null; url: string;
};

/** « 8 places restantes », « Complet », ou rien sans limite de places. */
export const textePlaces = (places: number | null) =>
  places === null ? null : places > 0 ? `${places} place${places > 1 ? 's' : ''} restante${places > 1 ? 's' : ''}` : 'Complet';

export const textePrix = (prix: DateLuma['prix']) => (prix ? `${formatPrix(prix.centimes, prix.devise)} par personne` : 'Gratuit');

/** Bouton vers la page Luma de l'événement (inscription et paiement chez Luma), dans un nouvel onglet. */
export function BoutonLuma({ url, titre, className = '' }: { url: string; titre: string; className?: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`${classeGrandBouton.primaire} ${className}`}>
      Réserver sur Luma<span className="sr-only"> : {titre} (nouvel onglet)</span>
    </a>
  );
}

/** Lien vers le calendrier Luma (aucune date à venir, ou Luma momentanément illisible). */
export function LienCalendrierLuma({ className = '' }: { className?: string }) {
  return (
    <a href={LIEN_LUMA} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-4 ${className}`}>
      Voir le calendrier sur Luma<span className="sr-only"> (nouvel onglet)</span>
    </a>
  );
}

/**
 * Prochaines dates d'une expérience, lues dans Luma, chacune avec son bouton « Réserver sur Luma ».
 * Sans date : « Prochaines dates bientôt » ; Luma illisible (null) : renvoi vers le calendrier Luma.
 */
export default function ProchainesDates({ dates, className = '' }: { dates: DateLuma[] | null; className?: string }) {
  if (dates === null || dates.length === 0) {
    return (
      <p className={`grid gap-2 ${className}`}>
        <span>{dates === null ? 'Les dates sont publiées sur notre calendrier Luma.' : 'Prochaines dates bientôt.'}</span>
        <LienCalendrierLuma />
      </p>
    );
  }
  return (
    <ul className={`grid gap-3 ${className}`}>
      {dates.map(date => (
        <li key={date.id} className="grid gap-3 rounded-2xl bg-fond-doux p-4">
          <div className="text-sm">
            <p className="font-bold">{formatDateHeure(date.debut)}</p>
            <p>{[date.lieu, textePrix(date.prix), textePlaces(date.placesRestantes)].filter(Boolean).join(' · ')}</p>
          </div>
          <BoutonLuma url={date.url} titre={date.titre} />
        </li>
      ))}
    </ul>
  );
}
