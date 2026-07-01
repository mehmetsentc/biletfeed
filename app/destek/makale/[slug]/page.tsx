import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SupportArticleView } from '@/components/support/support-center';
import {
  getAllArticleSlugs,
  getArticle
} from '@/lib/data/support-center';
import { getSupportUrl } from '@/lib/config/domain';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: 'Makale bulunamadı' };

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: getSupportUrl(`/makale/${slug}`)
    }
  };
}

export default async function SupportArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return <SupportArticleView article={article} />;
}
