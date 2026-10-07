import Link from 'next/link';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { Libelles } from '@/frontend/format';
import { classeChamp, classeChampErreur, classeLibelle } from '@/frontend/styles/classes';

// `erreur` : message affiché sous le champ (ex : « Champ obligatoire. »), qui remplace l'aide.
type Habillage = { libelle: string; aide?: string; erreur?: string };

const classeEnErreur = (erreur?: string) => (erreur ? classeChampErreur : classeChamp);

function Libelle({ libelle, aide, erreur, requis, children }: Habillage & { requis?: boolean; children: ReactNode }) {
  return (
    <label className={classeLibelle}>
      <span className="text-sm font-medium">
        {libelle}
        {requis && <span className="text-erreur" title="Obligatoire"> *</span>}
      </span>
      {children}
      {erreur ? <span className="text-sm font-medium text-erreur">{erreur}</span> : aide && <span className="text-sm text-texte-doux">{aide}</span>}
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

/** Cases à cocher : plusieurs valeurs pour un même champ (`name` répété dans le formulaire). */
export function ChampCases({ libelle, aide, erreur, name, options, valeurs }: Habillage & { name: string; options: Libelles; valeurs: string[] }) {
  const choix = Object.entries(options);
  return (
    <fieldset className={classeLibelle}>
      <legend className="mb-1 text-sm font-medium">{libelle}</legend>
      <div className={`grid max-h-56 gap-2 overflow-y-auto rounded-lg border bg-surface p-3 ${erreur ? 'border-erreur' : 'border-bordure-forte'}`}>
        {choix.length === 0 && <span className="text-sm text-texte-doux">Aucun choix pour l’instant.</span>}
        {choix.map(([valeur, texte]) => (
          <label key={valeur} className="flex items-start gap-2 text-sm">
            <input type="checkbox" name={name} value={valeur} defaultChecked={valeurs.includes(valeur)} className="mt-0.5 h-4 w-4 shrink-0 accent-primaire" />
            {texte}
          </label>
        ))}
      </div>
      {erreur ? <span className="text-sm font-medium text-erreur">{erreur}</span> : aide && <span className="text-sm text-texte-doux">{aide}</span>}
    </fieldset>
  );
}

/**
 * Case de consentement des formulaires publics (obligatoire, vérifiée aussi par le serveur), avec le lien vers
 * la politique de confidentialité, ouvert dans un nouvel onglet pour ne pas perdre la saisie.
 */
export function CaseConsentement({ usage, erreur }: { usage: string; erreur?: string }) {
  return (
    <div className="grid gap-1">
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consentement" required aria-invalid={erreur ? true : undefined} className="mt-0.5 h-4 w-4 shrink-0 accent-primaire" />
        <span>
          J’accepte que mes coordonnées soient utilisées {usage}, comme expliqué dans la{' '}
          <Link href="/confidentialite" target="_blank" className="underline">politique de confidentialité<span className="sr-only"> (nouvel onglet)</span></Link>
          <span className="text-erreur" title="Obligatoire"> *</span>
        </span>
      </label>
      {erreur && <span className="text-sm font-medium text-erreur">{erreur}</span>}
    </div>
  );
}

/** Champ piège anti-robots : hors de l'écran, ignoré au clavier et par les lecteurs d'écran ; un robot le remplit. */
export function ChampPiege() {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label>
        Site web (laisser vide)
        <input type="text" name="siteWeb" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
