'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icone from '@/frontend/components/Icone';

// Navigation de la maquette (écran « Frame 17 ») : grands liens, puis liens secondaires. Le blog est dans le pied de page.
const PRINCIPAUX = [
  { href: '/', label: 'Accueil' },
  { href: '/podcast', label: 'Podcast' },
  { href: '/experiences', label: 'Expériences' },
  { href: '/studio', label: 'Studio' },
];
const SECONDAIRES = [
  { href: '/contact', label: 'Contact' },
  { href: '/a-propos', label: 'À propos' },
];
// Sur ordinateur, le logo mène à l'accueil.
const NAVIGATION_ORDINATEUR = [...PRINCIPAUX.slice(1), ...SECONDAIRES.toReversed()];

export default function EnTete() {
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const fermer = () => setMenuOuvert(false);

  // Menu ouvert : la page ne défile plus derrière, et Échap le referme.
  useEffect(() => {
    if (!menuOuvert) return;
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOuvert(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', echap);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', echap);
    };
  }, [menuOuvert]);

  const estActif = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const courant = (href: string) => (estActif(href) ? 'page' : undefined);

  // Maquette : en-tête clair souligné d'un trait vert ; sur l'accueil, transparent au-dessus de la photo ;
  // menu ouvert (écran « Frame 17 »), vert foncé comme le menu.
  const accueil = pathname === '/';
  const apparence = menuOuvert
    ? 'zone-sombre bg-fond-sombre text-sur-fond-sombre'
    : accueil ? 'zone-sombre text-sur-fond-sombre' : 'border-b-2 border-titre bg-fond-doux text-texte';

  return (
    <header className={`${accueil ? 'absolute inset-x-0' : 'sticky'} top-0 z-50 ${apparence}`}>
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-5 sm:gap-6 lg:px-6">
        {/* Logo dessiné : vert vif sur l'en-tête clair, crème sur la photo de l'accueil et sur le menu ouvert. */}
        <Link href="/" onClick={fermer} className={`shrink-0 ${menuOuvert || accueil ? 'text-fond-doux' : 'text-titre'}`}>
          <Icone nom="logo" taille={56} />
          <span className="sr-only">Maison La recette, accueil</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-x-5 lg:flex xl:gap-x-7 xl:text-lg">
          {NAVIGATION_ORDINATEUR.map(lien => (
            <Link
              key={lien.href}
              href={lien.href}
              aria-current={courant(lien.href)}
              className={`whitespace-nowrap border-b-2 pb-0.5 ${estActif(lien.href) ? 'border-decor' : 'border-transparent hover:border-current'}`}
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOuvert(!menuOuvert)}
          className="-mr-2 p-1 lg:hidden"
          aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOuvert}
          aria-controls="menu-mobile"
        >
          <Icone nom={menuOuvert ? 'croix' : 'burger'} taille={48} />
        </button>
      </div>

      {menuOuvert && (
        <nav id="menu-mobile" aria-label="Menu" className="fixed inset-x-0 bottom-0 top-20 overflow-y-auto bg-fond-sombre px-8 pb-12 pt-[min(6.5rem,12vh)] lg:hidden">
          <ul className="grid gap-3">
            {PRINCIPAUX.map(lien => (
              <li key={lien.href}>
                <Link href={lien.href} onClick={fermer} aria-current={courant(lien.href)} className={`font-titre text-5xl min-[380px]:text-6xl ${estActif(lien.href) ? 'underline decoration-decor decoration-2 underline-offset-8' : ''}`}>
                  {lien.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-10 grid gap-3 text-xl">
            {SECONDAIRES.map(lien => (
              <li key={lien.href}><Link href={lien.href} onClick={fermer} aria-current={courant(lien.href)}>{lien.label}</Link></li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
