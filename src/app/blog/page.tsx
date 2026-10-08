import { pageBlog } from '@/backend/contenus/articles';
import { metadonnees } from '@/backend/seo';
import Blog from '@/frontend/pages/blog';

export const metadata = metadonnees({
  titre: 'Blog & Récits',
  description: 'Retours d’expérience, coulisses du podcast, guides pratiques et idées pour les entreprises.',
  chemin: '/blog',
});

// Articles lus dans src/contenu/blog/ (un article ajouté apparaît au prochain déploiement, aussitôt en local).
export default function BlogPage() {
  return <Blog {...pageBlog()} />;
}
