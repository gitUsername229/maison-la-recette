// Classes Tailwind partagées par les formulaires du site et de l'admin (couleurs : rôles du thème, voir globals.css).
// Le focus clavier est le contour commun défini dans globals.css.

const baseChamp = 'w-full min-w-0 rounded-lg border bg-surface px-3 py-2.5 text-texte placeholder:text-texte-doux';
export const classeChamp = `${baseChamp} border-bordure-forte`;
export const classeChampErreur = `${baseChamp} border-2 border-erreur`;

export const classeLibelle = 'grid min-w-0 gap-1';

export const classeBouton =
  'rounded-full bg-primaire px-5 py-3 font-medium text-sur-primaire hover:bg-primaire-fort disabled:opacity-60';

export const classeErreur = 'rounded-lg bg-erreur-fond px-3 py-2 text-sm text-erreur';
