import Link from 'next/link';

type Props = { actif: 'particuliers' | 'entreprises'; libelles: { particuliers: string; entreprises: string } };

/** Onglets Particuliers / Entreprises (maquette « Frame 18 ») : chacun a sa propre adresse. */
export default function OngletsExperiences({ actif, libelles }: Props) {
  const onglets = [
    { id: 'particuliers', href: '/experiences', libelle: libelles.particuliers },
    { id: 'entreprises', href: '/experiences/entreprises', libelle: libelles.entreprises },
  ] as const;
  return (
    <nav aria-label="Pour qui ?" className="mt-6 flex max-w-md rounded-full bg-pastel-chaud p-[5px]">
      {onglets.map(onglet => (
        <Link
          key={onglet.id}
          href={onglet.href}
          aria-current={onglet.id === actif ? 'page' : undefined}
          className={`flex-1 rounded-full py-2.5 text-center text-sm font-bold ${onglet.id === actif ? 'bg-primaire text-sur-primaire' : 'text-texte hover:underline'}`}
        >
          {onglet.libelle}
        </Link>
      ))}
    </nav>
  );
}
