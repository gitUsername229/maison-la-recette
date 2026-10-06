import Image from 'next/image';
import Link from 'next/link';
import Markdown from 'react-markdown';
import { formatDate } from '@/frontend/format';

export type ArticleComplet = { titre: string; contenu: string; image: string; imageAlt: string; datePublication: Date };

// Contenu en Markdown (écrit dans /admin/articles) ; le HTML brut n'est jamais interprété.
const STYLES = {
  h2: 'mt-10 font-serif text-2xl font-bold text-stone-900',
  h3: 'mt-8 font-serif text-xl font-bold text-stone-900',
  p: 'mt-4 leading-relaxed text-stone-700',
  ul: 'mt-4 list-disc space-y-1 pl-6 text-stone-700',
  ol: 'mt-4 list-decimal space-y-1 pl-6 text-stone-700',
  a: 'text-amber-800 underline',
  blockquote: 'mt-6 border-l-4 border-stone-300 pl-4 italic text-stone-600',
};

export default function Article({ article }: { article: ArticleComplet }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/blog" className="text-sm text-stone-500 hover:text-stone-800">← Tous les articles</Link>
      <p className="mt-8 text-sm text-stone-500">{formatDate(article.datePublication)}</p>
      <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-bold text-stone-900">{article.titre}</h1>
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
    </main>
  );
}
