export type AvisAffiche = { id: number; nom: string; citation: string; contexte: string; note: number | null };

/** Avis clients visibles (gérés dans /admin/avis). */
export default function ListeAvis({ avis, titre = 'Ils en parlent' }: { avis: AvisAffiche[]; titre?: string }) {
  if (avis.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="font-serif text-2xl">{titre}</h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {avis.map(a => (
          <li key={a.id}>
            <figure className="h-full rounded-2xl border border-stone-200 bg-white p-6">
              {a.note && <p className="text-amber-700" aria-label={`Note : ${a.note} sur 5`}>{'★'.repeat(a.note)}<span className="text-stone-300">{'★'.repeat(5 - a.note)}</span></p>}
              <blockquote className="mt-2 whitespace-pre-line leading-relaxed text-stone-700">« {a.citation} »</blockquote>
              <figcaption className="mt-4 text-sm"><span className="font-medium">{a.nom}</span> · <span className="text-stone-500">{a.contexte}</span></figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
