'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RESSOURCES_ADMIN } from './ressources';

const LIENS = [{ href: '/admin', titre: 'Tableau de bord' }, ...RESSOURCES_ADMIN.map(r => ({ href: `/admin/${r.cle}`, titre: r.titre }))];

export default function NavigationAdmin() {
  const chemin = usePathname();
  return (
    <nav aria-label="Administration" className="flex flex-wrap gap-2 border-b border-bordure pb-4 text-sm">
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
    </nav>
  );
}
