'use client';

import { useState } from 'react';

/** Lecteur Ausha chargé seulement au clic : la page ne charge pas des dizaines de lecteurs d'un coup. */
export default function LecteurAusha({ url, titre, libelle = 'Écouter l’épisode' }: { url: string; titre: string; libelle?: string }) {
  const [ouvert, setOuvert] = useState(false);
  if (!ouvert) {
    return (
      <button type="button" onClick={() => setOuvert(true)} className="inline-flex items-center gap-2 justify-self-start rounded-full bg-encre px-4 py-2 text-sm font-medium text-creme hover:bg-black">
        <span aria-hidden="true">▶</span> {libelle}
      </button>
    );
  }
  return <iframe src={url} title={`Lecteur : ${titre}`} className="h-[220px] w-full rounded-xl border-0" allow="autoplay" />;
}
