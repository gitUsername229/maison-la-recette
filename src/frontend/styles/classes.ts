// Classes Tailwind partagées par les formulaires du site et de l'admin (couleurs : rôles du thème, voir globals.css).
// Le focus clavier est le contour commun défini dans globals.css.

const baseChamp = 'w-full min-w-0 rounded-lg border bg-surface px-3 py-2.5 text-texte placeholder:text-texte-doux';
export const classeChamp = `${baseChamp} border-bordure-forte`;
export const classeChampErreur = `${baseChamp} border-2 border-erreur`;

export const classeLibelle = 'grid min-w-0 gap-1';

export const classeBouton =
  'rounded-full bg-primaire px-5 py-3 font-medium text-sur-primaire hover:bg-primaire-fort disabled:opacity-60';

/** Grands boutons de la maquette (51 px de haut, pleine largeur sur mobile). « contour » : sur fond clair. */
const baseGrandBouton = 'flex min-h-[51px] w-full items-center justify-center rounded-full px-6 py-2 text-center text-lg';
export const classeGrandBouton = {
  primaire: `${baseGrandBouton} bg-primaire text-sur-primaire hover:bg-primaire-fort`,
  secondaire: `${baseGrandBouton} bg-secondaire text-sur-secondaire hover:bg-secondaire-clair`,
  contour: `${baseGrandBouton} text-texte ring-2 ring-inset ring-texte hover:bg-fond`,
};

export const classeErreur = 'rounded-lg bg-erreur-fond px-3 py-2 text-sm text-erreur';
