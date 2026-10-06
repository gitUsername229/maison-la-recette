'use client';

import { useState } from 'react';

/** Lecteur Ausha chargé seulement au clic : la page ne charge pas des dizaines de lecteurs d'un coup. */
export default function LecteurAusha({ url, titre }: { url: string; titre: string }) {
  const [ouvert, setOuvert] = useState(false);
  if (!ouvert) {
    return (
      <button type="button" onClick={() => setOuvert(true)} className="inline-flex items-center gap-2 justify-self-start rounded-full bg-encre px-4 py-2 text-sm font-medium text-creme hover:bg-black">
        <span aria-hidden="true">▶</span> Écouter l’épisode
      </button>
    );
  }
  return <iframe src={url} title={`Lecteur : ${titre}`} className="h-[220px] w-full rounded-xl border-0" allow="autoplay" />;
}
