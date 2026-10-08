import Link from 'next/link';
import { RESEAUX_SOCIAUX } from '@/backend/site';
import Logo from '@/frontend/components/Logo';

// Les deux colonnes de liens de la maquette (les réseaux sociaux en tête de la seconde, voir RESEAUX_SOCIAUX).
// Le blog n'est que là (pas dans le menu).
const COLONNES = [
  [
    { href: '/podcast', label: 'Podcast' },
    { href: '/experiences', label: 'Expériences' },
    { href: '/studio', label: 'Studio' },
    { href: '/blog', label: 'Blog' },
  ],
  [
    { href: '/a-propos', label: 'À propos' },
    { href: '/contact', label: 'Contact' },
  ],
];

const classeLien = 'underline-offset-4 hover:underline';

/** Pied de page (maquette) : le logo, deux colonnes de liens, puis le copyright et les informations légales. */
export default function PiedDePage() {
  return (
    <footer className="border-t border-bordure bg-fond-doux text-texte">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-6 px-5 pb-8 pt-12 lg:px-6">
        <Link href="/" className="flex shrink-0 text-titre">
          <Logo className="h-(--logo-pied)" />
          <span className="sr-only">Maison La recette, accueil</span>
        </Link>
        <nav aria-label="Plan du site" className="grid grid-cols-2 gap-x-6 pt-1 sm:gap-x-20">
          {COLONNES.map((liens, i) => (
            <ul key={liens[0].href} className="grid content-start gap-3">
              {i === 1 && RESEAUX_SOCIAUX.map(reseau => (
                <li key={reseau.url}>
                  <a href={reseau.url} target="_blank" rel="noopener noreferrer" className={classeLien}>
                    {reseau.nom}<span className="sr-only"> (nouvel onglet)</span>
                  </a>
                </li>
              ))}
              {liens.map(lien => <li key={lien.href}><Link href={lien.href} className={classeLien}>{lien.label}</Link></li>)}
            </ul>
          ))}
        </nav>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-2 px-5 pb-8 text-xs lg:px-6">
        <p>© {new Date().getFullYear()} Maison La recette · Photos de démonstration : Unsplash</p>
        <nav aria-label="Informations légales" className="flex gap-4">
          <Link href="/mentions-legales" className={`underline ${classeLien}`}>Mentions légales</Link>
          <Link href="/confidentialite" className={`underline ${classeLien}`}>Confidentialité</Link>
        </nav>
      </div>
    </footer>
  );
}
