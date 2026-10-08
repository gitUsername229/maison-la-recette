import Carrousel from '@/frontend/components/Carrousel';

export type AvisAffiche = { id: number; nom: string; citation: string; contexte: string; note: number | null };

type Props = {
  avis: AvisAffiche[];
  titre?: string;            // titre de section (maquette : « Ils en parlent »)
  notes?: boolean;           // note moyenne en grand (« 4,8 … 27 avis de participants ») et étoiles de chaque avis
  nombre?: number;           // avis affichés (la moyenne compte tous les avis notés)
  surFondSombre?: boolean;
};

/** Note sur 5 en étoiles (la maquette dessine des carottes : icône attendue de Romain). */
function Etoiles({ note, className = '' }: { note: number; className?: string }) {
  return (
    <span aria-hidden="true" className={className}>
      {'★'.repeat(note)}<span className="opacity-35">{'★'.repeat(5 - note)}</span>
    </span>
  );
}

/** Avis clients visibles (gérés dans /admin/avis) : la note moyenne, puis les avis en carrousel sur mobile. */
export default function ListeAvis({ avis, titre, notes: avecNotes = true, nombre = 6, surFondSombre = false }: Props) {
  if (avis.length === 0) return null;
  const notes = avis.flatMap(a => (a.note ? [a.note] : []));
  const valeur = notes.length ? notes.reduce((somme, note) => somme + note, 0) / notes.length : null;
  const texteMoyenne = valeur?.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <section className="grid gap-5" aria-label={titre ? undefined : 'Avis des participants'}>
      {titre && <h2 className="text-xl font-bold text-titre">{titre}</h2>}
      {avecNotes && valeur !== null && (
        <p className="flex items-center gap-3">
          <span className="sr-only">Note moyenne : {texteMoyenne} sur 5, {notes.length} avis de participants</span>
          <span aria-hidden="true" className={`font-titre text-5xl leading-none ${surFondSombre ? '' : 'text-titre'}`}>{texteMoyenne}</span>
          <span aria-hidden="true" className="grid gap-0.5">
            <Etoiles note={Math.round(valeur)} className={`text-2xl leading-none ${surFondSombre ? '' : 'text-accent'}`} />
            <span className="text-sm">{notes.length} avis de participants</span>
          </span>
        </p>
      )}
      <Carrousel libelle="Avis des participants">
        {avis.slice(0, nombre).map(a => (
          <figure key={a.id} className="flex h-full flex-col gap-2 rounded-2xl bg-fond p-5 text-texte">
            {avecNotes && a.note && <p><span className="sr-only">Note : {a.note} sur 5</span><Etoiles note={a.note} className="text-lg text-accent" /></p>}
            <figcaption className="text-sm">
              <span className="font-bold">{a.nom}</span>
              {a.contexte && <> <span aria-hidden="true">•</span> {a.contexte}</>}
            </figcaption>
            <blockquote className="mt-1 whitespace-pre-line leading-relaxed">« {a.citation} »</blockquote>
          </figure>
        ))}
      </Carrousel>
    </section>
  );
}
