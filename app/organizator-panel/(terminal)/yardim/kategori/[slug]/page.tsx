import { notFound } from 'next/navigation';
import {
  getArticlesByCategory,
  getHelpCategory
} from '@/lib/data/organizer-help-center';
import { HelpCategoryView } from '@/components/organizator-panel/organizer-help-center';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function HelpCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getHelpCategory(slug);
  if (!category) notFound();

  const articles = getArticlesByCategory(slug);

  return <HelpCategoryView category={category} articles={articles} />;
}
