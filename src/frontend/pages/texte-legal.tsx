import Link from 'next/link';

type Props = {
  titre: string;
  avertissement: string;                 // bandeau « texte à valider » ; vide : rien n'est affiché
  contenu: string;                       // une ligne commençant par « ## » est un intertitre, les autres des paragraphes
  lien?: { href: string; texte: string };
};

/** Pages de texte (confidentialité, mentions légales), modifiables dans /admin/textes. */
export default function TexteLegal({ titre, avertissement, contenu, lien }: Props) {
  const lignes = contenu.split('\n').map(ligne => ligne.trim()).filter(Boolean);
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-6 lg:py-12">
      <h1 className="border-b border-texte pb-2 text-3xl font-bold lg:text-4xl">{titre}</h1>
      {avertissement && <p className="mt-6 rounded-lg bg-fond px-4 py-3 text-sm font-bold">{avertissement}</p>}
      <div className="mt-6 grid gap-3 leading-relaxed">
        {lignes.map((ligne, i) => (ligne.startsWith('## ')
          ? <h2 key={i} className="mt-5 text-xl font-bold">{ligne.slice(3)}</h2>
          : <p key={i}>{ligne}</p>))}
      </div>
      {lien && <Link href={lien.href} className="mt-8 inline-block underline">{lien.texte}</Link>}
    </main>
  );
}
