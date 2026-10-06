'use client';

import { useEffect, useState } from 'react';
import Champ, { ChampListe, ChampTexte } from '@/frontend/components/Champ';
import type { Libelles } from '@/frontend/format';
import { classeBouton, classeErreur } from '@/frontend/styles/classes';
import { appelerApi } from './api';
import ChampImage from './ChampImage';
import type { ChampAdmin, RessourceAdmin } from './ressources';
import { corpsFormulaire, valeurInitiale, type Ligne } from './valeurs';

type Props = {
  ressource: RessourceAdmin;
  ligne: Ligne | null;           // null : création
  onEnregistre: () => void;
  onAnnule: () => void;
};

/** Liste des expériences (pour choisir celle d'une session), chargée seulement si nécessaire. */
function useExperiences(necessaire: boolean) {
  const [experiences, setExperiences] = useState<Libelles>({});
  useEffect(() => {
    if (!necessaire) return;
    appelerApi<{ id: number; titre: string }[]>('/api/experiences').then(resultat => {
      if (resultat.ok) setExperiences(Object.fromEntries(resultat.donnees.map(e => [String(e.id), e.titre])));
    });
  }, [necessaire]);
  return experiences;
}

function ChampFormulaire({ champ, ligne, experiences }: { champ: ChampAdmin; ligne: Ligne | null; experiences: Libelles }) {
  const initiale = valeurInitiale(champ, ligne);
  const commun = { libelle: champ.libelle, aide: champ.aide, name: champ.nom, required: champ.requis, disabled: champ.creationSeulement && ligne !== null };
  switch (champ.type) {
    case 'booleen':
      return (
        <label className="flex items-start gap-3">
          <input type="checkbox" name={champ.nom} defaultChecked={initiale === true} className="mt-1 h-4 w-4 accent-stone-800" />
          <span className="grid gap-0.5"><span className="text-sm font-medium">{champ.libelle}</span>{champ.aide && <span className="text-xs text-stone-500">{champ.aide}</span>}</span>
        </label>
      );
    case 'texteLong': return <ChampTexte {...commun} defaultValue={String(initiale)} />;
    case 'image': return <ChampImage nom={champ.nom} libelle={champ.libelle} requis={champ.requis} aide={champ.aide} valeurInitiale={String(initiale)} />;
    case 'liste': return <ChampListe {...commun} options={champ.options ?? {}} vide={champ.requis ? undefined : '—'} defaultValue={String(initiale)} />;
    case 'experience': return <ChampListe key={Object.keys(experiences).length} {...commun} options={experiences} vide="Choisir…" defaultValue={String(initiale)} />;
    case 'nombre': return <Champ {...commun} type="number" min={0} defaultValue={String(initiale)} />;
    case 'prix': return <Champ {...commun} type="number" min={0} step="0.01" defaultValue={String(initiale)} />;
    case 'date': return <Champ {...commun} type="date" defaultValue={String(initiale)} />;
    case 'dateHeure': return <Champ {...commun} type="datetime-local" defaultValue={String(initiale)} />;
    default: return <Champ {...commun} defaultValue={String(initiale)} />;
  }
}

export default function FormulaireRessource({ ressource, ligne, onEnregistre, onAnnule }: Props) {
  const champs = ressource.champs ?? [];
  const creation = ligne === null;
  const experiences = useExperiences(champs.some(c => c.type === 'experience'));
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function enregistrer(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formulaire = new FormData(event.currentTarget);
    // Les photos passent par un champ caché, que le navigateur ne vérifie pas.
    const photoManquante = champs.find(c => c.type === 'image' && c.requis && !formulaire.get(c.nom));
    if (photoManquante) return setErreur(`Ajoutez : ${photoManquante.libelle}.`);

    setEnvoi(true);
    setErreur(null);
    const resultat = await appelerApi(creation ? ressource.api : `${ressource.api}/${ligne.id}`, {
      methode: creation ? 'POST' : ressource.methodeModification ?? 'PUT',
      corps: corpsFormulaire(champs, formulaire, creation),
      libelles: Object.fromEntries(champs.map(c => [c.nom, c.libelle])),
    });
    setEnvoi(false);
    if (!resultat.ok) return setErreur(resultat.message);
    onEnregistre();
  }

  return (
    <form onSubmit={enregistrer} className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6">
      <h2 className="font-serif text-2xl">{creation ? `Ajouter ${ressource.singulier}` : 'Modifier'}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {champs.map(champ => (
          <div key={champ.nom} className={champ.type === 'texteLong' || champ.type === 'image' ? 'md:col-span-2' : undefined}>
            <ChampFormulaire champ={champ} ligne={ligne} experiences={experiences} />
          </div>
        ))}
      </div>
      {erreur && <p role="alert" className={classeErreur}>{erreur}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={envoi} className={classeBouton}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
        <button type="button" onClick={onAnnule} className="rounded-full px-5 py-3 ring-1 ring-stone-300 hover:bg-stone-100">Annuler</button>
      </div>
    </form>
  );
}
