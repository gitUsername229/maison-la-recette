const TONS = {
  succes: 'bg-succes-fond text-succes ring-pastel',
  attente: 'bg-pastel-chaud text-primaire ring-pastel-chaud',
  annule: 'bg-fond text-texte-doux ring-bordure',
  neutre: 'bg-surface text-texte-doux ring-bordure',
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
