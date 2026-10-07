'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Icone from '@/frontend/components/Icone';

/** Liste déroulante des saisons (maquette « Frame 15 ») : la saison choisie s'affiche dans l'adresse (?saison=3). */
export default function ChoixSaison({ saisons, saison }: { saisons: number[]; saison: number }) {
  const router = useRouter();
  const chemin = usePathname();
  const parametres = useSearchParams();

  function changer(valeur: string) {
    const suite = new URLSearchParams(parametres);
    suite.set('saison', valeur);
    router.push(`${chemin}?${suite.toString()}`, { scroll: false });
  }

  return (
    <label className="relative inline-flex w-full max-w-[191px] items-center">
      <span className="sr-only">Saison</span>
      <select
        value={saison}
        onChange={e => changer(e.target.value)}
        className="w-full appearance-none rounded-lg bg-fond-doux py-2.5 pl-3 pr-9 text-sm font-bold text-texte"
      >
        {saisons.map(s => <option key={s} value={s}>Saison {s}</option>)}
      </select>
      <Icone nom="chevron-bas" taille={12} className="pointer-events-none absolute right-3" />
    </label>
  );
}
