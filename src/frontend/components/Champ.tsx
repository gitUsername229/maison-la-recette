import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { Libelles } from '@/frontend/format';
import { classeChamp, classeLibelle } from '@/frontend/styles/classes';

type Habillage = { libelle: string; aide?: string };

function Libelle({ libelle, aide, children }: Habillage & { children: ReactNode }) {
  return (
    <label className={classeLibelle}>
      <span className="text-sm font-medium">{libelle}</span>
      {children}
      {aide && <span className="text-xs text-stone-500">{aide}</span>}
    </label>
  );
}

/** Champ de saisie avec son libellé (et une aide facultative). */
export default function Champ({ libelle, aide, ...attributs }: Habillage & InputHTMLAttributes<HTMLInputElement>) {
  return <Libelle libelle={libelle} aide={aide}><input className={classeChamp} {...attributs} /></Libelle>;
}

/** Liste déroulante ; `vide` ajoute une première option sans valeur. */
export function ChampListe({ libelle, aide, options, vide, ...attributs }: Habillage & SelectHTMLAttributes<HTMLSelectElement> & { options: Libelles; vide?: string }) {
  return (
    <Libelle libelle={libelle} aide={aide}>
      <select className={classeChamp} {...attributs}>
        {vide !== undefined && <option value="">{vide}</option>}
        {Object.entries(options).map(([valeur, texte]) => <option key={valeur} value={valeur}>{texte}</option>)}
      </select>
    </Libelle>
  );
}

export function ChampTexte({ libelle, aide, ...attributs }: Habillage & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <Libelle libelle={libelle} aide={aide}><textarea className={`${classeChamp} min-h-32`} {...attributs} /></Libelle>;
}
