import Link from 'next/link';
import PhotoCarte from '@/frontend/components/PhotoCarte';
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
  `rounded-full px-4 py-2 text-sm ${actif ? 'bg-primaire text-sur-primaire' : 'text-texte-doux ring-1 ring-bordure-forte hover:bg-surface'}`;

/** Liste du blog : tous les articles (/blog) ou ceux d'une catégorie (/blog/categorie/<clé>). */
export default function Blog({ textes, articles, categories, categorieActive }: Props) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <span className="rounded-full bg-pastel px-3 py-1 text-xs font-semibold uppercase tracking-wider text-texte-doux">
        {textes.surtitre}
      </span>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl text-texte">
        {categorieActive?.libelle ?? textes.titre}
      </h1>
      <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-texte-doux">
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
        <div className="mt-12 rounded-2xl border border-dashed border-bordure-forte p-12 text-center text-texte-doux">
          <p className="whitespace-pre-line">{textes.aucunArticle}</p>
        </div>
      ) : (
        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {articles.map(article => (
            <li key={article.id}>
              <Link href={`/blog/${article.slug}`} className="group block">
                {article.image && <PhotoCarte src={article.image} alt={article.imageAlt} ratio="aspect-[16/10]" sizes="(min-width: 640px) 45vw, 100vw" />}
                <p className="mt-4 text-sm text-texte-doux">
                  <span className="font-semibold text-accent">{article.categorieLibelle}</span> · {formatDate(article.datePublication)}
                </p>
                <h2 className="mt-1 font-serif text-2xl text-texte group-hover:underline">{article.titre}</h2>
                <p className="mt-2 leading-relaxed text-texte-doux">{article.extrait}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
