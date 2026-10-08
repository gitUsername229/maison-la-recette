// Icônes de la maquette Figma (public/images/icones/). Elles sont affichées en masque : la forme vient du fichier,
// la couleur est celle du texte autour (thème), pour que la future DA puisse les recolorer depuis globals.css.
export type NomIcone = 'burger' | 'croix' | 'fleche-bas' | 'fleche-droite' | 'calendrier' | 'lecture' | 'lecture-petit' | 'suivant' | 'chevron-bas'
  | 'apple-podcasts' | 'carotte' | 'carotte-vide';

// Taille en pixels, ou, sans `taille`, donnée par une classe (ex. le logo Apple Podcasts : h-(--logo-plateforme)).
type Props = { nom: NomIcone; taille?: number; className?: string };

/** Icône décorative (masquée aux lecteurs d'écran : le bouton ou le lien qui la porte a son propre libellé). */
export default function Icone({ nom, taille, className = '' }: Props) {
  const masque = `url(/images/icones/${nom}.svg)`;
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: taille, height: taille, backgroundColor: 'currentColor',
        // « contain » : la forme garde ses proportions, même dans une case qui n'a pas les siennes.
        maskImage: masque, WebkitMaskImage: masque, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center', WebkitMaskPosition: 'center',
      }}
    />
  );
}
