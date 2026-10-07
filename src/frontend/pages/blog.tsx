import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/frontend/format';

export type ArticleResume = {
  id: number; slug: string; titre: string; extrait: string; image: string; imageAlt: string; datePublication: Date; categorieLibelle: string;
};
export type CategorieAffichee = { valeur: string; libelle: string; description: string };

/** Textes de la liste du blog, modifiables dans /admin/textes (page Blog). */
export type TextesBlog = Record<'surtitre' | 'titre' | 'introduction' | 'tousLesArticles' | 'aucunArticle', string>;

type Props = {
  textes: TextesBlog;
  articles: ArticleResume[];
  categories: CategorieAffichee[];
  categorieActive?: CategorieAffichee; // page /blog/categorie/<clé>
};

const classeOnglet = (actif: boolean) =>
  `rounded-full px-4 py-2 text-sm ${actif ? 'bg-encre text-creme' : 'text-stone-700 ring-1 ring-stone-300 hover:bg-white'}`;

/** Liste du blog : tous les articles (/blog) ou ceux d'une catégorie (/blog/categorie/<clé>). */
export default function Blog({ textes, articles, categories, categorieActive }: Props) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-700">
        {textes.surtitre}
      </span>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl font-bold text-stone-900">
        {categorieActive?.libelle ?? textes.titre}
      </h1>
      <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-stone-600">
        {categorieActive?.description ?? textes.introduction}
      </p>

      <nav aria-label="Catégories du blog" className="mt-10 flex flex-wrap gap-2">
        <Link href="/blog" aria-current={categorieActive ? undefined : 'page'} className={classeOnglet(!categorieActive)}>{textes.tousLesArticles}</Link>
        {categories.map(categorie => {
          const actif = categorie.valeur === categorieActive?.valeur;
          return (
            <Link key={categorie.valeur} href={`/blog/categorie/${categorie.valeur}`} aria-current={actif ? 'page' : undefined} className={classeOnglet(actif)}>
              {categorie.libelle}
            </Link>
          );
        })}
      </nav>

      {articles.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
          <p className="whitespace-pre-line">{textes.aucunArticle}</p>
        </div>
      ) : (
        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {articles.map(article => (
            <li key={article.id}>
              <Link href={`/blog/${article.slug}`} className="group block">
                {article.image && <Image src={article.image} alt={article.imageAlt} width={800} height={500} className="aspect-[16/10] w-full rounded-2xl object-cover" />}
                <p className="mt-4 text-sm text-stone-500">
                  <span className="font-medium text-amber-800">{article.categorieLibelle}</span> · {formatDate(article.datePublication)}
                </p>
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
