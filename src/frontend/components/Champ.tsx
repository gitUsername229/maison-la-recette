import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { Libelles } from '@/frontend/format';
import { classeChamp, classeLibelle } from '@/frontend/styles/classes';

// `erreur` : message affiché sous le champ (ex : « Champ obligatoire. »), qui remplace l'aide.
type Habillage = { libelle: string; aide?: string; erreur?: string };

const classeEnErreur = (erreur?: string) => (erreur ? `${classeChamp} border-red-600 focus:border-red-600 focus:ring-red-100` : classeChamp);

function Libelle({ libelle, aide, erreur, requis, children }: Habillage & { requis?: boolean; children: ReactNode }) {
  return (
    <label className={classeLibelle}>
      <span className="text-sm font-medium">
        {libelle}
        {requis && <span className="text-red-700" title="Obligatoire"> *</span>}
      </span>
      {children}
      {erreur ? <span className="text-xs font-medium text-red-700">{erreur}</span> : aide && <span className="text-xs text-stone-500">{aide}</span>}
    </label>
  );
}

/** Champ de saisie avec son libellé (astérisque si obligatoire), son aide ou son erreur. */
export default function Champ({ libelle, aide, erreur, ...attributs }: Habillage & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Libelle libelle={libelle} aide={aide} erreur={erreur} requis={attributs.required}>
      <input className={classeEnErreur(erreur)} aria-invalid={erreur ? true : undefined} {...attributs} />
    </Libelle>
  );
}

/** Liste déroulante ; `vide` ajoute une première option sans valeur. */
export function ChampListe({ libelle, aide, erreur, options, vide, ...attributs }: Habillage & SelectHTMLAttributes<HTMLSelectElement> & { options: Libelles; vide?: string }) {
  return (
    <Libelle libelle={libelle} aide={aide} erreur={erreur} requis={attributs.required}>
      <select className={classeEnErreur(erreur)} aria-invalid={erreur ? true : undefined} {...attributs}>
        {vide !== undefined && <option value="">{vide}</option>}
        {Object.entries(options).map(([valeur, texte]) => <option key={valeur} value={valeur}>{texte}</option>)}
      </select>
    </Libelle>
  );
}

export function ChampTexte({ libelle, aide, erreur, ...attributs }: Habillage & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Libelle libelle={libelle} aide={aide} erreur={erreur} requis={attributs.required}>
      <textarea className={`${classeEnErreur(erreur)} min-h-32`} aria-invalid={erreur ? true : undefined} {...attributs} />
    </Libelle>
  );
}
