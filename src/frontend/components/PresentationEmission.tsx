import Image from 'next/image';

type Props = { nom: string; accroche: string; niveau?: 'h1' | 'h2' };

/** Logo, nom et accroche de l'émission (maquette : en tête de la page podcast et du bloc podcast de l'accueil). */
export default function PresentationEmission({ nom, accroche, niveau: Titre = 'h2' }: Props) {
  return (
    <div className="flex items-center gap-4">
      <Image src="/images/podcast/logo-la-recette.png" alt="" width={96} height={96} className="h-24 w-24 shrink-0 rounded-md" />
      <div>
        <Titre className="text-4xl font-bold">{nom}</Titre>
        <p className="mt-1 text-sm leading-snug">{accroche}</p>
      </div>
    </div>
  );
}
