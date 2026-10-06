import Image from 'next/image';
import Pastille from '@/frontend/components/Pastille';
import { formatDate, formatDateHeure, formatPrix, libelle } from '@/frontend/format';
import type { ColonneAdmin } from './ressources';
import { lire, type Ligne } from './valeurs';

function Principale({ colonne, ligne }: { colonne: ColonneAdmin; ligne: Ligne }) {
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

/** Valeur d'une colonne (formatée) et ses compléments affichés en petit dessous. */
export default function Valeur({ colonne, ligne }: { colonne: ColonneAdmin; ligne: Ligne }) {
  return (
    <>
      <Principale colonne={colonne} ligne={ligne} />
      {colonne.complements?.map(chemin => {
        const complement = lire(ligne, chemin);
        return complement ? <span key={chemin} className="block text-xs text-stone-500">{String(complement)}</span> : null;
      })}
    </>
  );
}
