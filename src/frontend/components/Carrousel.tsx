'use client';

import { Children, isValidElement, useRef, useState, type ReactNode } from 'react';

type Props = { children: ReactNode; libelle: string; colonnes?: string };

const animation = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

/**
 * Carrousel de la maquette : sur mobile, les cartes défilent au doigt (la suivante dépasse) avec des points de
 * position, qui sont aussi des boutons ; sur ordinateur, une grille (`colonnes`).
 */
export default function Carrousel({ children, libelle, colonnes = 'lg:grid-cols-3' }: Props) {
  const liste = useRef<HTMLUListElement>(null);
  const [actif, setActif] = useState(0);
  const elements = Children.toArray(children);

  // Point actif : la carte la plus proche du bord gauche, ou la dernière en fin de défilement.
  function suivre() {
    const ul = liste.current;
    if (!ul) return;
    const cartes = [...ul.children] as HTMLElement[];
    if (ul.scrollLeft + ul.clientWidth >= ul.scrollWidth - 2) return setActif(cartes.length - 1);
    const depart = cartes[0]?.offsetLeft ?? 0;
    const ecarts = cartes.map(carte => Math.abs(carte.offsetLeft - depart - ul.scrollLeft));
    setActif(ecarts.indexOf(Math.min(...ecarts)));
  }

  const montrer = (i: number) =>
    (liste.current?.children[i] as HTMLElement | undefined)?.scrollIntoView({ behavior: animation(), inline: 'start', block: 'nearest' });

  return (
    // min-w-0 : dans une grille ou un flex, la largeur des cartes ne doit pas élargir la page.
    <div className="min-w-0">
      <ul
        ref={liste}
        onScroll={suivre}
        aria-label={libelle}
        className={`relative -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 ${colonnes}`}
      >
        {elements.map((element, i) => (
          <li key={isValidElement(element) ? element.key : i} className="w-[85%] shrink-0 snap-start sm:w-[60%] lg:w-auto">{element}</li>
        ))}
      </ul>
      {elements.length > 1 && (
        <div className="mt-3 flex justify-center lg:hidden">
          {elements.map((element, i) => (
            <button
              key={isValidElement(element) ? element.key : i}
              type="button"
              onClick={() => montrer(i)}
              aria-label={`Afficher l’élément ${i + 1} sur ${elements.length}`}
              aria-current={i === actif ? 'true' : undefined}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${i === actif ? 'bg-primaire' : 'bg-fond'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
