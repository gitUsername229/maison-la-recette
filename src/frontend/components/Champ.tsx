import type { InputHTMLAttributes } from 'react';
import { classeChamp, classeLibelle } from '@/frontend/styles/classes';

type Props = InputHTMLAttributes<HTMLInputElement> & { libelle: string; aide?: string };

/** Champ de formulaire avec son libellé (et une aide facultative). */
export default function Champ({ libelle, aide, ...attributs }: Props) {
  return (
    <label className={classeLibelle}>
      <span className="text-sm font-medium">{libelle}</span>
      <input className={classeChamp} {...attributs} />
      {aide && <span className="text-xs text-stone-500">{aide}</span>}
    </label>
  );
}
