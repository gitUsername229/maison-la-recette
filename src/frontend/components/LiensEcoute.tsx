type Props = { titre: string; liens: readonly { plateforme: string; url: string }[]; className?: string };

/** Plateformes d'écoute de l'émission (src/backend/podcast/emission.ts), en pastilles cerclées (maquette). */
export default function LiensEcoute({ titre, liens, className = '' }: Props) {
  return (
    <div className={className}>
      <p className="text-sm font-bold">{titre}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {liens.map(lien => (
          <li key={lien.url}>
            <a href={lien.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold ring-2 ring-texte hover:bg-fond">
              {lien.plateforme}<span className="sr-only"> (nouvel onglet)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
