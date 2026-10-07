'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/frontend/auth-client';
import Feuille from '@/frontend/components/Feuille';

const liensNavigation = [
  { href: '/podcast', label: 'Podcast' },
  { href: '/experiences', label: 'Ateliers' },
  { href: '/studio', label: 'Studio de production' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export default function EnTete() {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOuvert, setMenuOuvert] = useState(false);

  async function deconnecter() {
    await authClient.signOut();
    setMenuOuvert(false);
    router.push('/');
    router.refresh();
  }

  const estActif = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-bordure bg-fond/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo / Titre du site */}
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-2xl font-semibold lowercase tracking-tight text-primaire"
          onClick={() => setMenuOuvert(false)}
        >
          <Feuille className="h-7 w-7" />
          Maison La recette
        </Link>

        {/* Navigation Desktop */}
        <nav className="hidden lg:flex items-center gap-x-6 text-sm font-medium">
          {liensNavigation.map((lien) => {
            const actif = estActif(lien.href);
            return (
              <Link
                key={lien.href}
                href={lien.href}
                aria-current={actif ? 'page' : undefined}
                className={`border-b-2 pb-0.5 hover:text-texte ${
                  actif ? 'border-accent font-semibold text-texte' : 'border-transparent text-texte-doux'
                }`}
              >
                {lien.label}
              </Link>
            );
          })}
        </nav>

        {/* Espace Compte / Auth Desktop */}
        <div className="hidden lg:flex items-center gap-x-4 text-sm">
          {!isPending && (session ? (
            <div className="flex items-center gap-x-4">
              {session.user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="rounded-full bg-pastel-chaud px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-texte"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/compte"
                className={`text-texte-doux hover:text-texte ${
                  estActif('/compte') ? 'font-semibold text-texte' : ''
                }`}
              >
                Mon compte
              </Link>
              <button
                type="button"
                onClick={deconnecter}
                className="text-texte-doux hover:text-texte cursor-pointer"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-x-3">
              <Link
                href="/connexion"
                className="text-texte-doux hover:text-texte font-medium"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-full bg-primaire px-4 py-2 text-xs font-semibold tracking-wide text-sur-primaire hover:bg-primaire-fort"
              >
                Créer un compte
              </Link>
            </div>
          ))}
        </div>

        {/* Bouton Menu Burger Mobile */}
        <button
          type="button"
          onClick={() => setMenuOuvert(!menuOuvert)}
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-bordure-forte text-texte-doux hover:bg-fond"
          aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOuvert}
        >
          {menuOuvert ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu Déroulant Mobile */}
      {menuOuvert && (
        <div className="lg:hidden border-t border-bordure bg-fond px-6 py-6 shadow-xl">
          <nav className="flex flex-col gap-y-4 text-base font-medium">
            {liensNavigation.map((lien) => {
              const actif = estActif(lien.href);
              return (
                <Link
                  key={lien.href}
                  href={lien.href}
                  onClick={() => setMenuOuvert(false)}
                  aria-current={actif ? 'page' : undefined}
                  className={`py-1 ${
                    actif
                      ? 'font-bold text-primaire border-l-4 border-accent pl-3 -ml-4'
                      : 'text-texte-doux hover:text-texte'
                  }`}
                >
                  {lien.label}
                </Link>
              );
            })}

            {/* Auth Mobile */}
            <div className="mt-4 border-t border-bordure-forte pt-4 flex flex-col gap-y-3 text-sm">
              {!isPending && (session ? (
                <>
                  {session.user.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOuvert(false)}
                      className="text-primaire font-semibold"
                    >
                      Interface Administration
                    </Link>
                  )}
                  <Link
                    href="/compte"
                    onClick={() => setMenuOuvert(false)}
                    className="text-texte-doux hover:text-texte font-medium"
                  >
                    Mon compte ({session.user.name || session.user.email})
                  </Link>
                  <button
                    type="button"
                    onClick={deconnecter}
                    className="text-left text-erreur font-medium"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-y-2 pt-2">
                  <Link
                    href="/connexion"
                    onClick={() => setMenuOuvert(false)}
                    className="text-texte-doux hover:text-texte font-medium py-1"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/inscription"
                    onClick={() => setMenuOuvert(false)}
                    className="rounded-xl bg-primaire py-2.5 text-center font-semibold text-sur-primaire hover:bg-primaire-fort"
                  >
                    Créer un compte
                  </Link>
                </div>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
