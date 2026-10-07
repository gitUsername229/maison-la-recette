'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/frontend/auth-client';
import { RESSOURCES_ADMIN } from './ressources';

const LIENS = [{ href: '/admin', titre: 'Tableau de bord' }, ...RESSOURCES_ADMIN.map(r => ({ href: `/admin/${r.cle}`, titre: r.titre }))];

export default function NavigationAdmin() {
  const chemin = usePathname();
  const router = useRouter();
  // Lire la session la prolonge : 30 jours à compter de la dernière visite (voir src/backend/auth/auth.ts).
  authClient.useSession();

  async function deconnecter() {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <nav aria-label="Administration" className="flex flex-wrap items-center gap-2 border-b border-bordure pb-4 text-sm">
      {LIENS.map(({ href, titre }) => (
        <Link
          key={href}
          href={href}
          aria-current={chemin === href ? 'page' : undefined}
          className={`rounded-full px-3 py-1.5 ${chemin === href ? 'bg-primaire text-sur-primaire' : 'text-texte-doux ring-1 ring-bordure hover:bg-surface'}`}
        >
          {titre}
        </Link>
      ))}
      <span className="ml-auto flex gap-4">
        <Link href="/" className="underline">Voir le site</Link>
        <button type="button" onClick={deconnecter} className="underline">Déconnexion</button>
      </span>
    </nav>
  );
}
