'use client';

import { useState } from 'react';

/** Long texte replié sur quelques lignes, avec « Lire la suite ». */
export default function TexteRepliable({ texte, seuil = 320 }: { texte: string; seuil?: number }) {
  const [deplie, setDeplie] = useState(false);
  const long = texte.length > seuil;
  return (
    <div>
      <p className={`whitespace-pre-line leading-relaxed text-texte-doux ${long && !deplie ? 'line-clamp-4' : ''}`}>{texte}</p>
      {long && (
        <button type="button" onClick={() => setDeplie(!deplie)} aria-expanded={deplie} className="mt-1 text-sm underline">
          {deplie ? 'Réduire' : 'Lire la suite'}
        </button>
      )}
    </div>
  );
}
