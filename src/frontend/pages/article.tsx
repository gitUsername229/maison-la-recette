import Image from 'next/image';
import Link from 'next/link';
import Markdown from 'react-markdown';
import { AppelDevis, BlocEpisode, BlocExperiences, type EpisodeLie, type ExperienceLiee } from '@/frontend/components/BlocsArticle';
import { formatDate } from '@/frontend/format';

export type ArticleComplet = {
  titre: string; contenu: string; image: string; imageAlt: string; datePublication: Date;
  categorie: string; categorieLibelle: string;
  appelDevis: boolean;               // article pour les entreprises : encadré « Demander un devis »
  episode: EpisodeLie | null;
  experiences: ExperienceLiee[];
};

/** Textes des blocs sous l'article (src/contenu/textes.ts, page Blog). */
export type TextesArticle = Record<
  | 'tousLesArticles' | 'episodeTitre' | 'episodeBouton' | 'episodeLien'
  | 'experiencesTitre' | 'experiencesTexte' | 'experiencesBouton' | 'entreprisesTitre' | 'entreprisesTexte' | 'entreprisesBouton',
  string
>;

// Contenu en Markdown (src/contenu/blog/) ; le HTML brut n'est jamais interprété.
const STYLES = {
  h2: 'mt-10 font-titre text-2xl text-titre',
  h3: 'mt-8 text-xl font-bold text-titre',
  p: 'mt-4 leading-relaxed',
  ul: 'mt-4 list-disc space-y-1 pl-6',
  ol: 'mt-4 list-decimal space-y-1 pl-6',
  a: 'text-accent underline',
  blockquote: 'mt-6 border-l-4 border-bordure-forte pl-4 italic',
};

export default function Article({ article, textes }: { article: ArticleComplet; textes: TextesArticle }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-6 lg:py-12">
      <Link href="/blog" className="text-sm underline-offset-4 hover:underline">← {textes.tousLesArticles}</Link>
      <p className="mt-8 text-sm">
        <Link href={`/blog/categorie/${article.categorie}`} className="font-bold text-accent hover:underline">{article.categorieLibelle}</Link>
        {' · '}{formatDate(article.datePublication)}
      </p>
      <h1 className="mt-2 font-titre text-4xl text-titre">{article.titre}</h1>
      {article.image && <Image src={article.image} alt={article.imageAlt} width={1200} height={750} priority className="mt-8 aspect-[16/10] w-full rounded-2xl object-cover" />}
      <div className="mt-8">
        <Markdown
          components={{
            h1: ({ children }) => <h2 className={STYLES.h2}>{children}</h2>,
            h2: ({ children }) => <h2 className={STYLES.h2}>{children}</h2>,
            h3: ({ children }) => <h3 className={STYLES.h3}>{children}</h3>,
            p: ({ children }) => <p className={STYLES.p}>{children}</p>,
            ul: ({ children }) => <ul className={STYLES.ul}>{children}</ul>,
            ol: ({ children }) => <ol className={STYLES.ol}>{children}</ol>,
            a: ({ children, href }) => <a href={href} className={STYLES.a}>{children}</a>,
            blockquote: ({ children }) => <blockquote className={STYLES.blockquote}>{children}</blockquote>,
          }}
        >
          {article.contenu}
        </Markdown>
      </div>
      {article.appelDevis && (
        <AppelDevis experience={article.experiences[0]?.slug} textes={{ titre: textes.entreprisesTitre, texte: textes.entreprisesTexte, bouton: textes.entreprisesBouton }} />
      )}
      {article.episode && <BlocEpisode episode={article.episode} textes={{ titre: textes.episodeTitre, bouton: textes.episodeBouton, lien: textes.episodeLien }} />}
      <BlocExperiences experiences={article.experiences} textes={{ titre: textes.experiencesTitre, texte: textes.experiencesTexte, bouton: textes.experiencesBouton }} />
    </main>
  );
}
