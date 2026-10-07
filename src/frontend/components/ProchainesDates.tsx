import { formatDateHeure, formatPrix } from '@/frontend/format';

export type DateOuverte = { id: number; dateDebut: Date | string; lieu: string; placesRestantes: number; prixCents: number };

/** Dates ouvertes d'une expérience, visibles sans compte (page de l'expérience, articles du blog). */
export default function ProchainesDates({ sessions, className = '' }: { sessions: DateOuverte[]; className?: string }) {
  if (sessions.length === 0) return <p className={`text-sm text-texte-doux ${className}`}>Aucune date ouverte pour le moment.</p>;
  return (
    <ul className={`grid gap-2 text-sm ${className}`}>
      {sessions.map(s => (
        <li key={s.id} className="rounded-lg bg-fond px-3 py-2">
          <span className="font-medium">{formatDateHeure(s.dateDebut)}</span>
          <span className="block text-texte-doux">
            {s.lieu} · {s.placesRestantes > 0 ? `${s.placesRestantes} place${s.placesRestantes > 1 ? 's' : ''}` : 'Complet'} · {formatPrix(s.prixCents)}
          </span>
        </li>
      ))}
    </ul>
  );
}
