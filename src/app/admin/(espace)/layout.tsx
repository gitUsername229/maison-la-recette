import NavigationAdmin from '@/frontend/admin/NavigationAdmin';

// Pas de contrôle d'accès ici (un layout n'est pas réévalué à chaque navigation) :
// chaque page de l'espace admin appelle exigerAdminPage, qui vérifie connexion et rôle côté serveur.
export default function LayoutEspaceAdmin({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-16 pt-6">
      <NavigationAdmin />
      <div className="mt-8">{children}</div>
    </div>
  );
}
