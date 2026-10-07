import { useCallback, useEffect, useState } from 'react';
import type { Libelles } from '@/frontend/format';
import { appelerApi } from './api';
import type { ElementApi, SourceOptions } from './ressources';

/**
 * Options lues dans l'API (expériences, épisodes, catégories…) : chaque route n'est appelée qu'une fois.
 * Renvoie une fonction qui donne les options d'une source, ou null tant qu'elles ne sont pas chargées.
 */
export function useOptionsApi(sources: (SourceOptions | undefined)[]) {
  const apis = [...new Set(sources.flatMap(source => (source ? [source.api] : [])))].sort().join('\n');
  const [elements, setElements] = useState<Record<string, ElementApi[]>>({});

  useEffect(() => {
    let actuel = true;
    for (const api of apis ? apis.split('\n') : []) {
      appelerApi<ElementApi[]>(api).then(resultat => {
        if (actuel && resultat.ok) setElements(avant => ({ ...avant, [api]: resultat.donnees }));
      });
    }
    return () => { actuel = false; };
  }, [apis]);

  return useCallback((source: SourceOptions): Libelles | null => {
    const charges = elements[source.api];
    return charges ? { ...source.fixes, ...Object.fromEntries(charges.map(e => [source.valeur(e), source.libelle(e)])) } : null;
  }, [elements]);
}
