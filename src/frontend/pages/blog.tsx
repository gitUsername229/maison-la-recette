import Link from 'next/link';
import PhotoCarte from '@/frontend/components/PhotoCarte';
import { formatDate } from '@/frontend/format';
import { classeSurtitre } from '@/frontend/styles/classes';

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

// Onglets en pastilles, comme les filtres du podcast.
const classeOnglet = (actif: boolean) =>
  `rounded-full px-4 py-2 text-sm ${actif ? 'bg-primaire font-bold text-sur-primaire' : 'bg-fond hover:bg-pastel'}`;

/** Liste du blog : tous les articles (/blog) ou ceux d'une catégorie (/blog/categorie/<clé>). */
export default function Blog({ textes, articles, categories, categorieActive }: Props) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 lg:px-6 lg:py-12">
      <p className={classeSurtitre}>{textes.surtitre}</p>
      <h1 className="mt-4 text-4xl font-bold">{categorieActive?.libelle ?? textes.titre}</h1>
      <p className="mt-6 whitespace-pre-line text-lg leading-relaxed">{categorieActive?.description ?? textes.introduction}</p>

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
        <div className="mt-12 rounded-2xl bg-fond p-12 text-center">
          <p className="whitespace-pre-line">{textes.aucunArticle}</p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {articles.map(article => (
            <li key={article.id}>
              {/* Carte blanche, comme les cartes d'expériences de la maquette. */}
              <Link href={`/blog/${article.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl bg-fond">
                {article.image && <PhotoCarte src={article.image} alt={article.imageAlt} ratio="aspect-[16/10]" sizes="(min-width: 640px) 45vw, 100vw" />}
                <div className="p-5">
                  <p className="text-sm">
                    <span className="font-bold text-accent">{article.categorieLibelle}</span> · {formatDate(article.datePublication)}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold group-hover:underline">{article.titre}</h2>
                  <p className="mt-2 leading-relaxed">{article.extrait}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
