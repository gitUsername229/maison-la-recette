'use client';

import Image from 'next/image';
import { useState } from 'react';
import { classeLibelle } from '@/frontend/styles/classes';
import { appelerApi } from './api';

type Props = { nom: string; libelle: string; requis?: boolean; aide?: string; erreur?: string; valeurInitiale: string };

/** Choix d'une photo : envoi du fichier, puis le chemin obtenu est enregistré avec le formulaire. */
export default function ChampImage({ nom, libelle, requis, aide, erreur, valeurInitiale }: Props) {
  const [url, setUrl] = useState(valeurInitiale);
  const [etat, setEtat] = useState<string | null>(null);

  async function envoyer(event: React.ChangeEvent<HTMLInputElement>) {
    const fichier = event.target.files?.[0];
    event.target.value = '';
    if (!fichier) return;
    setEtat('Envoi de la photo…');
    const formulaire = new FormData();
    formulaire.append('fichier', fichier);
    const resultat = await appelerApi<{ url: string }>('/api/images/fichier', { methode: 'POST', corps: formulaire });
    if (!resultat.ok) return setEtat(resultat.message);
    setUrl(resultat.donnees.url);
    setEtat(null);
  }

  return (
    <div className={classeLibelle}>
      <span className="text-sm font-medium">{libelle}{requis && <span className="text-red-700" title="Obligatoire"> *</span>}</span>
      <input type="hidden" name={nom} value={url} />
      <div className="flex flex-wrap items-center gap-3">
        {url && <Image src={url} alt="" width={64} height={64} unoptimized className="h-16 w-16 rounded-lg object-cover ring-1 ring-stone-200" />}
        <label className="cursor-pointer rounded-full px-4 py-2 text-sm ring-1 ring-stone-300 hover:bg-stone-100">
          {url ? 'Changer la photo' : 'Choisir une photo'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={envoyer} />
        </label>
        {url && !requis && <button type="button" onClick={() => setUrl('')} className="text-sm underline">Retirer</button>}
      </div>
      {erreur && !etat
        ? <span className="text-xs font-medium text-red-700">{erreur}</span>
        : <span className="text-xs text-stone-500">{etat ?? aide ?? 'JPG, PNG ou WebP, 5 Mo maximum.'}</span>}
    </div>
  );
}
