import { notFound } from 'next/navigation';
import Link from 'next/link';
import { HomeFeedTabs } from '@/components/feed/home-feed-tabs';
import { FeedArticleView } from '@/components/feed/feed-article-view';
import { JsonLd } from '@/lib/seo/json-ld';
import { buildBreadcrumbSchema } from '@/lib/seo/schemas';
import { createFeedArticleMetadata } from '@/lib/seo/feed-metadata';
import { getFeedPostBySlug, recordFeedView } from '@/lib/services/feed';
import { siteConfig } from '@/lib/config/site';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getFeedPostBySlug(slug);
  if (!post) return { title: 'Hikâye bulunamadı' };
  return createFeedArticleMetadata(post);
}

export default async function FeedArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getFeedPostBySlug(slug);
  if (!post) notFound();

  void recordFeedView(post.id);

  const breadcrumbs = buildBreadcrumbSchema([
    { name: 'Ana Sayfa', url: siteConfig.url },
    { name: 'Feed', url: `${siteConfig.url}/feed` },
    { name: post.title, url: `${siteConfig.url}/feed/${post.slug}` }
  ]);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.summary,
    image: [post.coverImage],
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: post.authorName },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: { '@type': 'ImageObject', url: `${siteConfig.url}/brand/logo-dark.png` }
    },
    mainEntityOfPage: `${siteConfig.url}/feed/${post.slug}`
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbs} />
      <JsonLd data={articleSchema} />

      <section className="border-b border-border bg-card/50 py-4">
        <div className="container mx-auto px-4">
          <HomeFeedTabs />
          <nav className="mt-4 text-sm text-muted-foreground">
            <Link href="/feed" className="hover:text-primary">
              Feed
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{post.title}</span>
          </nav>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <FeedArticleView post={post} />
      </div>
    </div>
  );
}
