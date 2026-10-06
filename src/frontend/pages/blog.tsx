import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/frontend/format';

export type ArticleResume = { id: number; slug: string; titre: string; extrait: string; image: string; imageAlt: string; datePublication: Date };

export default function Blog({ articles }: { articles: ArticleResume[] }) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-700">
        Blog & Conseils
      </span>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl font-bold text-stone-900">
        Le Blog
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-stone-600">
        Retrouvez ici nos articles, idées de recettes anti-gaspi et réflexions sur l’alimentation durable.
      </p>
      {articles.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
          <p>Les articles du blog sont en cours de rédaction.</p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-amber-800 hover:underline">
            ← Retour à l’accueil
          </Link>
        </div>
      ) : (
        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {articles.map(article => (
            <li key={article.id}>
              <Link href={`/blog/${article.slug}`} className="group block">
                {article.image && <Image src={article.image} alt={article.imageAlt} width={800} height={500} className="aspect-[16/10] w-full rounded-2xl object-cover" />}
                <p className="mt-4 text-sm text-stone-500">{formatDate(article.datePublication)}</p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-stone-900 group-hover:underline">{article.titre}</h2>
                <p className="mt-2 leading-relaxed text-stone-600">{article.extrait}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
