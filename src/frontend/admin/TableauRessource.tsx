'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Pastille from '@/frontend/components/Pastille';
import { formatDate, formatDateHeure, formatPrix, libelle } from '@/frontend/format';
import { classeBouton, classeChamp, classeErreur } from '@/frontend/styles/classes';
import { appelerApi } from './api';
import FormulaireRessource from './FormulaireRessource';
import { ressourceAdmin, type ColonneAdmin, type RessourceAdmin } from './ressources';
import { lire, type Ligne } from './valeurs';

const classeAction = 'text-sm underline decoration-stone-300 underline-offset-4 hover:decoration-stone-800';

function Cellule({ colonne, ligne }: { colonne: ColonneAdmin; ligne: Ligne }) {
  const valeur = lire(ligne, colonne.chemin);
  if (valeur === null || valeur === undefined || valeur === '') return <span className="text-stone-400">—</span>;
  const texte = String(valeur);
  switch (colonne.format) {
    case 'date': return <>{formatDate(texte)}</>;
    case 'dateHeure': return <>{formatDateHeure(texte)}</>;
    case 'prix': return <>{formatPrix(Number(valeur))}</>;
    case 'booleen': return <>{valeur ? 'Oui' : 'Non'}</>;
    case 'image': return <Image src={texte} alt="" width={48} height={48} unoptimized className="h-12 w-12 rounded object-cover" />;
    case 'statut': return <Pastille statut={texte} texte={libelle(colonne.libelles ?? {}, texte)} />;
    default: return <>{colonne.libelles ? libelle(colonne.libelles, texte) : texte}</>;
  }
}

/** Nom d'une ligne pour les confirmations (première colonne textuelle). */
function nomLigne(ressource: RessourceAdmin, ligne: Ligne) {
  const colonne = ressource.colonnes.find(c => c.format !== 'image') ?? ressource.colonnes[0];
  return String(lire(ligne, colonne.chemin) ?? ligne.id);
}

export default function TableauRessource({ cle }: { cle: string }) {
  const ressource = ressourceAdmin(cle)!;
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [filtre, setFiltre] = useState('');
  const [edition, setEdition] = useState<Ligne | 'nouveau' | null>(null);
  const [message, setMessage] = useState<{ erreur: boolean; texte: string } | null>(null);
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

  /** Action sur une ligne, puis rechargement de la liste. */
  async function agir(ligne: Ligne, methode: 'PATCH' | 'DELETE', corps: unknown, reussite: string) {
    const resultat = await appelerApi(`${ressource.api}/${ligne.id}`, { methode, corps });
    setMessage(resultat.ok ? { erreur: false, texte: reussite } : { erreur: true, texte: resultat.message });
    if (resultat.ok) recharger();
  }

  function supprimer(ligne: Ligne) {
    if (confirm(`Supprimer « ${nomLigne(ressource, ligne)} » ? Cette action est définitive.`)) agir(ligne, 'DELETE', undefined, 'Suppression effectuée.');
  }

  function annuler(ligne: Ligne) {
    if (confirm(`Annuler la réservation n° ${ligne.id} ? Les places seront libérées.`)) agir(ligne, 'PATCH', { statut: 'annulee' }, 'Réservation annulée.');
  }

  function enregistre() {
    setEdition(null);
    setMessage({ erreur: false, texte: 'Enregistré.' });
    recharger();
  }

  const modifiable = Boolean(ressource.champs);
  const avecActions = modifiable || ressource.suppression || ressource.annulation || ressource.statut;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl">{ressource.titre}</h1>
          <p className="mt-2 text-stone-600">{ressource.description}</p>
        </div>
        {modifiable && ressource.creation !== false && edition === null && (
          <button type="button" onClick={() => { setMessage(null); setEdition('nouveau'); }} className={classeBouton}>Ajouter</button>
        )}
      </div>

      {message && <p role="status" className={`mt-6 ${message.erreur ? classeErreur : 'rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800'}`}>{message.texte}</p>}

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
                      <Cellule colonne={c} ligne={ligne} />
                      {c.complements?.map(chemin => {
                        const complement = lire(ligne, chemin);
                        return complement ? <span key={chemin} className="block text-xs text-stone-500">{String(complement)}</span> : null;
                      })}
                    </td>
                  ))}
                  {ressource.statut && (
                    <td className="px-4 py-3">
                      <select
                        aria-label="Statut"
                        className="rounded-lg border border-stone-300 bg-white px-2 py-1.5"
                        value={String(lire(ligne, ressource.statut.champ))}
                        onChange={e => agir(ligne, 'PATCH', { [ressource.statut!.champ]: e.target.value }, 'Statut mis à jour.')}
                      >
                        {Object.entries(ressource.statut.options).map(([valeur, texte]) => <option key={valeur} value={valeur}>{texte}</option>)}
                      </select>
                    </td>
                  )}
                  {avecActions && (
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-4">
                        {modifiable && <button type="button" onClick={() => { setMessage(null); setEdition(ligne); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={classeAction}>Modifier</button>}
                        {ressource.annulation && ligne.statut !== 'annulee' && <button type="button" onClick={() => annuler(ligne)} className={classeAction}>Annuler</button>}
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
