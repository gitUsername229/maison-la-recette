import Icone from '@/frontend/components/Icone';

/**
 * Note sur 5 en carottes (icônes de la maquette) : orange pleines, puis vides (estompées) pour le reste.
 * Décoratif : la note est donnée en texte à côté (visible ou pour les lecteurs d'écran).
 */
export default function Carottes({ note, taille }: { note: number; taille: number }) {
  return (
    <span aria-hidden="true" className="inline-flex gap-1 align-middle text-notation">
      {Array.from({ length: 5 }, (_, i) => <Icone key={i} nom={i < note ? 'carotte' : 'carotte-vide'} taille={taille} />)}
    </span>
  );
}
