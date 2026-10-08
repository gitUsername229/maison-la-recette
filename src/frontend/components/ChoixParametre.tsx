'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Icone from '@/frontend/components/Icone';

type Props = { parametre: string; etiquette: string; options: { valeur: number; texte: string }[]; valeur: number };

/**
 * Liste déroulante en pastille blanche (maquette) dont le choix s'inscrit dans l'adresse : ?saison=3 (podcast),
 * ?annee=2026 (expériences passées). La page ne remonte pas en haut.
 */
export default function ChoixParametre({ parametre, etiquette, options, valeur }: Props) {
  const router = useRouter();
  const chemin = usePathname();
  const parametres = useSearchParams();

  function changer(nouvelle: string) {
    const suite = new URLSearchParams(parametres);
    suite.set(parametre, nouvelle);
    router.push(`${chemin}?${suite.toString()}`, { scroll: false });
  }

  return (
    <label className="relative inline-flex w-full max-w-[280px] items-center">
      <span className="sr-only">{etiquette}</span>
      <select
        value={valeur}
        onChange={e => changer(e.target.value)}
        className="min-h-12 w-full appearance-none rounded-full bg-fond py-2.5 pl-5 pr-11 text-sm text-texte"
      >
        {options.map(option => <option key={option.valeur} value={option.valeur}>{option.texte}</option>)}
      </select>
      <Icone nom="chevron-bas" taille={12} className="pointer-events-none absolute right-5" />
    </label>
  );
}
