import Image from 'next/image';

type Props = { nom: string; accroche: string; niveau?: 'h1' | 'h2' };

/** Logo, nom et accroche de l'émission (maquette : en tête de la page podcast et du bloc podcast de l'accueil). */
export default function PresentationEmission({ nom, accroche, niveau: Titre = 'h2' }: Props) {
  return (
    <div className="flex items-center gap-4">
      {/* Fichier de 1080 px affiché à la taille --logo-emission (globals.css), hauteur suivant la largeur ; sizes ne
          sert qu’à choisir le fichier à télécharger et reprend ces mêmes tailles. */}
      <Image
        src="/images/podcast/logo-la-recette.png" alt="" width={1080} height={1080}
        sizes="(min-width: 64rem) 7rem, (min-width: 48rem) 6rem, 5rem"
        className="h-auto w-(--logo-emission) shrink-0 rounded-md"
      />
      <div>
        <Titre className="font-titre text-4xl text-titre">{nom}</Titre>
        <p className="mt-1 text-sm leading-snug">{accroche}</p>
      </div>
    </div>
  );
}
