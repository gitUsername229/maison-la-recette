'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/frontend/auth-client';

const classeLien = 'text-stone-600 hover:text-stone-900';

export default function EnTete() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  async function deconnecter() {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5 text-sm">
      <Link href="/" className="font-serif text-lg">Maison La recette</Link>
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link href="/experiences" className={classeLien}>Expériences</Link>
        {!isPending && (session ? (
          <>
            {session.user.role === 'admin' && <Link href="/admin" className={classeLien}>Administration</Link>}
            <Link href="/compte" className={classeLien}>Mon compte</Link>
            <button type="button" onClick={deconnecter} className={classeLien}>Déconnexion</button>
          </>
        ) : (
          <>
            <Link href="/connexion" className={classeLien}>Connexion</Link>
            <Link href="/inscription" className="rounded-full bg-encre px-4 py-2 text-creme hover:bg-black">Créer un compte</Link>
          </>
        ))}
      </nav>
    </header>
  );
}
