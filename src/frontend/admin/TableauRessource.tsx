'use client';

import { useEffect, useState } from 'react';
import { classeBouton, classeChamp, classeErreur } from '@/frontend/styles/classes';
import { appelerApi } from './api';
import FormulaireRessource from './FormulaireRessource';
import { ressourceAdmin, type ActionLigne, type RessourceAdmin } from './ressources';
import Valeur from './Valeur';
import { lire, type Ligne } from './valeurs';

const classeAction = 'text-sm underline decoration-stone-300 underline-offset-4 hover:decoration-stone-800';

type Message = { erreur: boolean; texte: string; proposition?: { action: ActionLigne; ligne: Ligne } };

const actionsPossibles = (ressource: RessourceAdmin, ligne: Ligne) =>
  (ressource.actions ?? []).filter(action => action.si.valeurs.includes(lire(ligne, action.si.chemin)));

export default function TableauRessource({ cle }: { cle: string }) {
  const ressource = ressourceAdmin(cle)!;
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [filtre, setFiltre] = useState('');
  const [edition, setEdition] = useState<Ligne | 'nouveau' | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [version, setVersion] = useState(0); // incrémentée pour recharger la liste
  const recharger = () => setVersion(v => v + 1);

  const url = filtre && ressource.filtre ? `${ressource.api}?${ressource.filtre.parametre}=${filtre}` : ressource.api;
  useEffect(() => {
    let actuel = true;
    appelerApi<Ligne[]>(url).then(resultat => {
      if (!actuel) return;
      if (resultat.ok) setLignes(resultat.donnees);
      else setMessage({ erreur: true, texte: resultat.message });
    });
    return () => { actuel = false; };
  }, [url, version]);

  /** Appel sur une ligne, puis message et rechargement ; une suggestion de l'API devient un bouton. */
  async function appeler(ligne: Ligne, methode: 'PUT' | 'PATCH' | 'DELETE', corps: unknown, reussite: string) {
    const resultat = await appelerApi(`${ressource.api}/${ligne.id}`, { methode, corps });
    if (!resultat.ok) {
      const action = ressource.actions?.find(a => a.id === resultat.suggestion);
      return setMessage({ erreur: true, texte: resultat.message, proposition: action && { action, ligne } });
    }
    setEdition(null);
    setMessage({ erreur: false, texte: reussite });
    recharger();
  }

  function executer(action: ActionLigne, ligne: Ligne) {
    if (action.confirmation && !confirm(action.confirmation(ligne))) return;
    appeler(ligne, action.methode, action.corps, action.message);
  }

  function supprimer(ligne: Ligne) {
    if (confirm(`Supprimer ${ressource.designation(ligne)} ? Cette action est définitive.`)) appeler(ligne, 'DELETE', undefined, ressource.textes.supprime);
  }

  async function lancerActionGlobale(action: { libelle: string; api: string }) {
    setMessage({ erreur: false, texte: `${action.libelle}…` });
    const resultat = await appelerApi<{ message?: string }>(action.api, { methode: 'POST', corps: {} });
    setMessage(resultat.ok ? { erreur: false, texte: resultat.donnees.message ?? 'Terminé.' } : { erreur: true, texte: resultat.message });
    if (resultat.ok) recharger();
  }

  function ouvrir(ligne: Ligne | 'nouveau') {
    setMessage(null);
    setEdition(ligne);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function enregistre(texte: string) {
    setEdition(null);
    setMessage({ erreur: false, texte });
    recharger();
  }

  const modifiable = Boolean(ressource.champs);
  const avecActions = modifiable || ressource.fiche || ressource.suppression || ressource.actions;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl">{ressource.titre}</h1>
          <p className="mt-2 text-stone-600">{ressource.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {ressource.actionGlobale && (
            <button type="button" onClick={() => lancerActionGlobale(ressource.actionGlobale!)} className="rounded-full px-5 py-3 ring-1 ring-stone-300 hover:bg-white">
              {ressource.actionGlobale.libelle}
            </button>
          )}
          {modifiable && ressource.creation !== false && edition === null && (
            <button type="button" onClick={() => ouvrir('nouveau')} className={classeBouton}>Ajouter</button>
          )}
        </div>
      </div>

      {message && (
        <div role="status" className={`mt-6 ${message.erreur ? classeErreur : 'rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800'}`}>
          {message.texte}
          {message.proposition && (
            <button type="button" onClick={() => executer(message.proposition!.action, message.proposition!.ligne)} className="ml-3 rounded-full bg-white px-3 py-1 font-medium text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50">
              {message.proposition.action.libelle}
            </button>
          )}
        </div>
      )}

      {edition !== null && (
        <div className="mt-6">
          <FormulaireRessource key={edition === 'nouveau' ? 'nouveau' : edition.id} ressource={ressource} ligne={edition === 'nouveau' ? null : edition} onEnregistre={enregistre} onAnnule={() => setEdition(null)} />
        </div>
      )}

      {ressource.filtre && (
        <label className="mt-6 flex max-w-xs items-center gap-3 text-sm">
          <span className="shrink-0">Afficher</span>
          <select className={classeChamp} value={filtre} onChange={e => setFiltre(e.target.value)}>
            <option value="">Tout</option>
            {Object.entries(ressource.filtre.options).map(([valeur, texte]) => <option key={valeur} value={valeur}>{texte}</option>)}
          </select>
        </label>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-stone-200">
        {lignes === null ? (
          <p className="p-6 text-stone-500">Chargement…</p>
        ) : lignes.length === 0 ? (
          <p className="p-6 text-stone-500">Rien pour l’instant.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                {ressource.colonnes.map(c => <th key={c.chemin} className="px-4 py-3 font-medium">{c.libelle}</th>)}
                {ressource.statut && <th className="px-4 py-3 font-medium">Statut</th>}
                {avecActions && <th className="px-4 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {lignes.map(ligne => (
                <tr key={ligne.id} className="align-top">
                  {ressource.colonnes.map(c => (
                    <td key={c.chemin} className={`max-w-xs px-4 py-3 ${c.format && c.format !== 'texte' ? 'whitespace-nowrap' : 'whitespace-pre-line'}`}>
                      <Valeur colonne={c} ligne={ligne} />
                    </td>
                  ))}
                  {ressource.statut && (
                    <td className="px-4 py-3">
                      <select
                        aria-label="Statut"
                        className="rounded-lg border border-stone-300 bg-white px-2 py-1.5"
                        value={String(lire(ligne, ressource.statut.champ))}
                        onChange={e => appeler(ligne, 'PATCH', { [ressource.statut!.champ]: e.target.value }, 'Statut mis à jour.')}
                      >
                        {Object.entries(ressource.statut.options).map(([valeur, texte]) => <option key={valeur} value={valeur}>{texte}</option>)}
                      </select>
                    </td>
                  )}
                  {avecActions && (
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-4">
                        {(modifiable || ressource.fiche) && <button type="button" onClick={() => ouvrir(ligne)} className={classeAction}>{modifiable ? 'Modifier' : 'Voir'}</button>}
                        {actionsPossibles(ressource, ligne).map(action => (
                          <button key={action.id} type="button" onClick={() => executer(action, ligne)} className={classeAction}>{action.libelle}</button>
                        ))}
                        {ressource.suppression && <button type="button" onClick={() => supprimer(ligne)} className={`${classeAction} text-red-700`}>Supprimer</button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
