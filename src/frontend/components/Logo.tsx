const MASQUE = 'url(/images/logo-maison-la-recette.svg)';

/**
 * Logo dessiné « Maison la recette » (fichier de la maquette, carré), affiché en masque : sa couleur est celle du
 * texte autour. La hauteur vient d'une variable du thème (`className`, ex. h-(--logo-entete)), la largeur suit
 * (aspect-square), sans jamais déformer le dessin. Décoratif : le lien qui le porte a son propre nom.
 */
export default function Logo({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block aspect-square shrink-0 bg-current align-middle ${className}`}
      style={{
        maskImage: MASQUE, WebkitMaskImage: MASQUE, maskSize: 'contain', WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center',
      }}
    />
  );
}
