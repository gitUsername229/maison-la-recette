import type { ChampAdmin } from './ressources';

export type Ligne = Record<string, unknown> & { id: string | number };

/** Lit une valeur imbriquée : lire(ligne, 'session.experience.titre'). */
export function lire(objet: unknown, chemin: string): unknown {
  return chemin.split('.').reduce<unknown>((valeur, cle) => (valeur && typeof valeur === 'object' ? (valeur as Record<string, unknown>)[cle] : undefined), objet);
}

/** Date ISO → valeur d'un champ datetime-local (heure locale du navigateur). */
function versDateHeureLocale(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** Valeur en base → valeur initiale du champ de formulaire. */
export function valeurInitiale(champ: ChampAdmin, ligne: Ligne | null): string | boolean {
  if (!ligne) return champ.defaut ?? (champ.type === 'booleen' ? false : '');
  const valeur = ligne[champ.nom];
  if (champ.type === 'booleen') return Boolean(valeur);
  if (valeur === null || valeur === undefined) return '';
  if (champ.type === 'prix') return (Number(valeur) / 100).toFixed(2);
  if (champ.type === 'date') return String(valeur).slice(0, 10);
  if (champ.type === 'dateHeure') return versDateHeureLocale(String(valeur));
  return String(valeur);
}

/** Champ du formulaire → valeur envoyée à l'API (undefined = champ non envoyé). */
function valeurEnvoyee(champ: ChampAdmin, formulaire: FormData): unknown {
  if (champ.type === 'booleen') return formulaire.has(champ.nom);
  const texte = String(formulaire.get(champ.nom) ?? '').trim();
  if (!texte) {
    if (champ.nullable) return null;
    // Les textes vides restent des textes (ex : description de photo facultative).
    return ['texte', 'texteLong', 'image'].includes(champ.type) ? '' : undefined;
  }
  switch (champ.type) {
    case 'nombre': case 'experience': return Number(texte);
    case 'prix': return Math.round(Number(texte.replace(',', '.')) * 100);
    case 'dateHeure': return new Date(texte).toISOString();
    default: return texte;
  }
}

/** Corps de la requête POST / PUT / PATCH à partir du formulaire. */
export function corpsFormulaire(champs: ChampAdmin[], formulaire: FormData, creation: boolean) {
  const corps: Record<string, unknown> = {};
  for (const champ of champs) {
    if (champ.creationSeulement && !creation) continue;
    const valeur = valeurEnvoyee(champ, formulaire);
    if (valeur !== undefined) corps[champ.nom] = valeur;
  }
  return corps;
}
