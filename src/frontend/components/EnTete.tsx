'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/frontend/auth-client';
import Feuille from '@/frontend/components/Feuille';
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
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();
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

  async function deconnecter() {
    await authClient.signOut();
    fermer();
    router.push('/');
    router.refresh();
  }

  const estActif = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const courant = (href: string) => (estActif(href) ? 'page' : undefined);

  return (
    <header className="zone-sombre sticky top-0 z-50 bg-fond-sombre text-sur-fond-sombre">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 lg:px-6">
        <Link href="/" onClick={fermer} className="flex items-center gap-2 text-2xl lowercase">
          <Feuille className="h-7 w-7" />
          Maison La recette
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-x-7 text-lg lg:flex">
          {NAVIGATION_ORDINATEUR.map(lien => (
            <Link
              key={lien.href}
              href={lien.href}
              aria-current={courant(lien.href)}
              className={`border-b-2 pb-0.5 ${estActif(lien.href) ? 'border-decor' : 'border-transparent hover:border-lien-sur-sombre'}`}
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-x-5 lg:flex">
          {!isPending && (session ? (
            <>
              {session.user.role === 'admin' && (
                <Link href="/admin" className="rounded-full bg-pastel px-3 py-1 text-xs font-bold uppercase tracking-wider text-texte">Admin</Link>
              )}
              <Link href="/compte" aria-current={courant('/compte')} className="hover:underline">Mon compte</Link>
              <button type="button" onClick={deconnecter} className="text-lien-sur-sombre hover:underline">Déconnexion</button>
            </>
          ) : (
            <>
              <Link href="/connexion" className="hover:underline">Connexion</Link>
              <Link href="/inscription" className="rounded-full bg-primaire px-5 py-2 font-bold text-sur-primaire hover:bg-primaire-fort">Créer un compte</Link>
            </>
          ))}
        </div>

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
        <nav id="menu-mobile" aria-label="Menu" className="fixed inset-x-0 bottom-0 top-20 overflow-y-auto bg-fond-sombre px-8 pb-12 pt-10 lg:hidden">
          <ul className="grid gap-1">
            {PRINCIPAUX.map(lien => (
              <li key={lien.href}>
                <Link href={lien.href} onClick={fermer} aria-current={courant(lien.href)} className={`text-5xl min-[380px]:text-6xl ${estActif(lien.href) ? 'underline decoration-decor decoration-2 underline-offset-8' : ''}`}>
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
          <div className="mt-10 grid gap-3 border-t border-sur-fond-sombre/30 pt-6 text-lg text-lien-sur-sombre">
            {!isPending && (session ? (
              <>
                {session.user.role === 'admin' && <Link href="/admin" onClick={fermer}>Administration</Link>}
                <Link href="/compte" onClick={fermer}>Mon compte</Link>
                <button type="button" onClick={deconnecter} className="text-left">Déconnexion</button>
              </>
            ) : (
              <>
                <Link href="/connexion" onClick={fermer}>Connexion</Link>
                <Link href="/inscription" onClick={fermer}>Créer un compte</Link>
              </>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
