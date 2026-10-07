'use client';

import { useState } from 'react';
import Champ, { ChampCases, ChampListe, ChampTexte } from '@/frontend/components/Champ';
import type { Libelles } from '@/frontend/format';
import { classeBouton, classeErreur } from '@/frontend/styles/classes';
import { appelerApi } from './api';
import ChampImage from './ChampImage';
import { useOptionsApi } from './options';
import { champsDe, type ChampAdmin, type RessourceAdmin } from './ressources';
import Valeur from './Valeur';
import { corpsFormulaire, valeurInitiale, type Ligne } from './valeurs';

type Props = {
  ressource: RessourceAdmin;
  ligne: Ligne | null;              // null : création
  onEnregistre: (message: string) => void;
  onAnnule: () => void;
};

const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/** Une valeur déjà enregistrée mais absente des options reste proposée, pour ne jamais la changer sans le vouloir. */
function avecValeurActuelle(options: Libelles, actuelle: string): Libelles {
  return actuelle && !Object.hasOwn(options, actuelle) ? { ...options, [actuelle]: actuelle } : options;
}

// `options` : celles du champ, ou lues dans l'API (null tant qu'elles se chargent).
type ProprietesChamp = { champ: ChampAdmin; ligne: Ligne | null; options: Libelles | null; erreur?: string };

function ChampFormulaire({ champ, ligne, options, erreur }: ProprietesChamp) {
  const initiale = valeurInitiale(champ, ligne);
  const commun = { libelle: champ.libelle, aide: champ.aide, erreur, name: champ.nom, required: champ.requis, disabled: champ.creationSeulement && ligne !== null };
  switch (champ.type) {
    case 'booleen':
      return (
        <label className="flex items-start gap-3">
          <input type="checkbox" name={champ.nom} defaultChecked={initiale === true} className="mt-1 h-4 w-4 accent-primaire" />
          <span className="grid gap-0.5"><span className="text-sm font-medium">{champ.libelle}</span>{champ.aide && <span className="text-xs text-texte-doux">{champ.aide}</span>}</span>
        </label>
      );
    case 'texteLong': return <ChampTexte {...commun} maxLength={champ.longueurMax} defaultValue={String(initiale)} />;
    case 'image': return <ChampImage nom={champ.nom} libelle={champ.libelle} requis={champ.requis} aide={champ.aide} erreur={erreur} valeurInitiale={String(initiale)} />;
    // Remonté une fois les options chargées, pour présélectionner la valeur enregistrée.
    case 'liste':
      return options
        ? <ChampListe key="pret" {...commun} options={avecValeurActuelle(options, String(initiale))} vide={champ.requis ? 'Choisir…' : '—'} defaultValue={String(initiale)} />
        : <ChampListe key="attente" {...commun} options={{}} vide="Chargement…" disabled />;
    case 'listeMultiple':
      return <ChampCases key={options ? 'pret' : 'attente'} libelle={champ.libelle} aide={champ.aide} erreur={erreur} name={champ.nom} options={options ?? {}} valeurs={Array.isArray(initiale) ? initiale : []} />;
    case 'nombre': return <Champ {...commun} type="number" min={0} defaultValue={String(initiale)} />;
    // Prix en euros, virgule ou point acceptés (45 ; 45,50 ; 45.50).
    case 'prix': return <Champ {...commun} inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" title="Un montant en euros, ex : 45 ou 45,50" placeholder="ex : 45,00" defaultValue={String(initiale)} />;
    case 'date': return <Champ {...commun} type="date" defaultValue={String(initiale)} />;
    case 'dateHeure': return <Champ {...commun} type="datetime-local" defaultValue={String(initiale)} />;
    default: return <Champ {...commun} maxLength={champ.longueurMax} defaultValue={String(initiale)} />;
  }
}

/** Fiche en lecture seule (réservations, devis…). */
function Fiche({ ressource, ligne }: { ressource: RessourceAdmin; ligne: Ligne }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
      {ressource.fiche?.map(colonne => (
        <div key={colonne.chemin} className="contents">
          <dt className="text-texte-doux">{colonne.libelle}</dt>
          <dd className="whitespace-pre-line"><Valeur colonne={colonne} ligne={ligne} /></dd>
        </div>
      ))}
    </dl>
  );
}

export default function FormulaireRessource({ ressource, ligne, onEnregistre, onAnnule }: Props) {
  const champs = champsDe(ressource, ligne);
  const creation = ligne === null;
  const optionsApi = useOptionsApi(champs.map(c => c.source));
  const optionsDe = (champ: ChampAdmin) => (champ.source ? optionsApi(champ.source) : champ.options ?? {});
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreursChamps, setErreursChamps] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);

  async function enregistrer(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formulaire = new FormData(event.currentTarget);
    // Les photos passent par un champ caché, que le navigateur ne vérifie pas.
    const photoManquante = champs.find(c => c.type === 'image' && c.requis && !formulaire.get(c.nom));
    if (photoManquante) {
      setErreursChamps({ [photoManquante.nom]: 'Ajoutez une photo.' });
      return setErreur(`« ${photoManquante.libelle} » : ajoutez une photo.`);
    }
    setEnvoi(true);
    setErreur(null);
    setErreursChamps({});
    const resultat = await appelerApi(creation ? ressource.api : `${ressource.api}/${ligne.id}`, {
      methode: creation ? 'POST' : ressource.methodeModification ?? 'PUT',
      corps: corpsFormulaire(champs, formulaire, creation),
      libelles: Object.fromEntries(champs.map(c => [c.nom, c.libelle])),
    });
    setEnvoi(false);
    if (!resultat.ok) {
      setErreursChamps(resultat.erreursChamps);
      return setErreur(resultat.message);
    }
    onEnregistre(ressource.textes.enregistre);
  }

  const titre = creation ? `Ajouter ${ressource.singulier}` : `${champs.length ? 'Modifier ' : ''}${champs.length ? ressource.designation(ligne) : majuscule(ressource.designation(ligne))}`;

  return (
    <div className="grid gap-5 rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-bordure sm:p-6">
      <h2 className="font-serif text-2xl">{titre}</h2>
      {!creation && ressource.fiche && <Fiche ressource={ressource} ligne={ligne} />}
      {champs.length > 0 ? (
        <form onSubmit={enregistrer} className="grid gap-4">
          <p className="text-xs text-texte-doux">Les champs marqués <span className="text-erreur">*</span> sont obligatoires.</p>
          <div className="grid gap-4 md:grid-cols-2">
            {champs.map(champ => (
              <div key={champ.nom} className={champs.length === 1 || ['texteLong', 'image', 'listeMultiple'].includes(champ.type) ? 'md:col-span-2' : undefined}>
                <ChampFormulaire champ={champ} ligne={ligne} options={optionsDe(champ)} erreur={erreursChamps[champ.nom]} />
              </div>
            ))}
          </div>
          {erreur && <p role="alert" className={classeErreur}>{erreur}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={envoi} className={classeBouton}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
            <button type="button" onClick={onAnnule} className="rounded-full px-5 py-3 ring-1 ring-bordure-forte hover:bg-fond">Annuler</button>
          </div>
        </form>
      ) : (
        <div><button type="button" onClick={onAnnule} className="rounded-full px-5 py-3 ring-1 ring-bordure-forte hover:bg-fond">Fermer</button></div>
      )}
    </div>
  );
}
