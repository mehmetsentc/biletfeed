import { notFound } from 'next/navigation';
import { getHelpArticle } from '@/lib/data/organizer-help-center';
import { HelpArticleView } from '@/components/organizator-panel/organizer-help-center';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function HelpArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) notFound();

  return <HelpArticleView article={article} />;
}
