'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/frontend/auth-client';

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
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-creme/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo / Titre du site */}
        <Link
          href="/"
          className="font-serif text-xl font-bold tracking-tight text-encre hover:opacity-90 transition-opacity"
          onClick={() => setMenuOuvert(false)}
        >
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
                className={`transition-colors hover:text-stone-900 ${
                  actif
                    ? 'font-semibold text-stone-900 border-b-2 border-amber-800 pb-0.5'
                    : 'text-stone-600'
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
                  className="rounded-lg bg-stone-200/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-800 hover:bg-stone-300 transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/compte"
                className={`text-stone-600 hover:text-stone-900 transition-colors ${
                  estActif('/compte') ? 'font-semibold text-stone-900' : ''
                }`}
              >
                Mon compte
              </Link>
              <button
                type="button"
                onClick={deconnecter}
                className="text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-x-3">
              <Link
                href="/connexion"
                className="text-stone-600 hover:text-stone-900 font-medium transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-full bg-encre px-4 py-2 text-xs font-semibold tracking-wide text-creme hover:bg-black transition-colors"
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
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors"
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
        <div className="lg:hidden border-t border-stone-200 bg-creme px-6 py-6 shadow-xl">
          <nav className="flex flex-col gap-y-4 text-base font-medium">
            {liensNavigation.map((lien) => {
              const actif = estActif(lien.href);
              return (
                <Link
                  key={lien.href}
                  href={lien.href}
                  onClick={() => setMenuOuvert(false)}
                  className={`py-1 transition-colors ${
                    actif
                      ? 'font-bold text-amber-900 border-l-4 border-amber-800 pl-3 -ml-4'
                      : 'text-stone-700 hover:text-stone-950'
                  }`}
                >
                  {lien.label}
                </Link>
              );
            })}

            {/* Auth Mobile */}
            <div className="mt-4 border-t border-stone-300 pt-4 flex flex-col gap-y-3 text-sm">
              {!isPending && (session ? (
                <>
                  {session.user.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOuvert(false)}
                      className="text-amber-800 font-semibold"
                    >
                      Interface Administration
                    </Link>
                  )}
                  <Link
                    href="/compte"
                    onClick={() => setMenuOuvert(false)}
                    className="text-stone-700 hover:text-stone-950 font-medium"
                  >
                    Mon compte ({session.user.name || session.user.email})
                  </Link>
                  <button
                    type="button"
                    onClick={deconnecter}
                    className="text-left text-red-700 font-medium"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-y-2 pt-2">
                  <Link
                    href="/connexion"
                    onClick={() => setMenuOuvert(false)}
                    className="text-stone-700 hover:text-stone-950 font-medium py-1"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/inscription"
                    onClick={() => setMenuOuvert(false)}
                    className="rounded-xl bg-encre py-2.5 text-center font-semibold text-creme hover:bg-black transition-colors"
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
