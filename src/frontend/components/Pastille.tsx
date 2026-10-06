const TONS = {
  succes: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  attente: 'bg-amber-50 text-amber-800 ring-amber-200',
  annule: 'bg-stone-100 text-stone-500 ring-stone-200',
  neutre: 'bg-white text-stone-700 ring-stone-200',
} as const;

// Statut stocké en base → couleur de la pastille.
const TON_PAR_STATUT: Record<string, keyof typeof TONS> = {
  payee: 'succes', traitee: 'succes', ouverte: 'succes', publie: 'succes',
  en_attente: 'attente', nouvelle: 'attente', en_cours: 'attente',
  annulee: 'annule', complete: 'annule',
};

/** Petite étiquette de statut (réservation, devis, session…). */
export default function Pastille({ statut, texte }: { statut: string; texte: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${TONS[TON_PAR_STATUT[statut] ?? 'neutre']}`}>{texte}</span>;
}
