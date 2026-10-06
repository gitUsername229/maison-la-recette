import type { Metadata } from 'next';
import NavigationAdmin from '@/frontend/admin/NavigationAdmin';

// Pas de contrôle d'accès ici (un layout n'est pas réévalué à chaque navigation) :
// chaque page de /admin appelle exigerConnexionPage(…, 'admin').
export const metadata: Metadata = { title: 'Administration | Maison La recette', robots: { index: false, follow: false } };

export default function LayoutAdmin({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-16">
      <NavigationAdmin />
      <div className="mt-8">{children}</div>
    </div>
  );
}
