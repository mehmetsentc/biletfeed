import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SupportCategoryView } from '@/components/support/support-center';
import {
  getArticlesByCategory,
  getCategory,
  getAllCategorySlugs
} from '@/lib/data/support-center';
import { getSupportUrl } from '@/lib/config/domain';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllCategorySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: 'Kategori bulunamadı' };

  return {
    title: category.title,
    description: category.description,
    alternates: {
      canonical: getSupportUrl(`/kategori/${slug}`)
    }
  };
}

export default async function SupportCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const articles = getArticlesByCategory(slug);

  return <SupportCategoryView category={category} articles={articles} />;
}
