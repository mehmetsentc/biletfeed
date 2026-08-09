import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FeedArticleView } from '@/components/feed/feed-article-view';
import { FeedBackButton } from '@/components/feed/feed-back-button';
import { FeedShareButton } from '@/components/feed/feed-share-button';
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
    dateModified: (post as { updatedAt?: string }).updatedAt ?? post.publishedAt,
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

      <section className="border-b border-border bg-card/40 py-3">
        <div className="container mx-auto flex max-w-3xl items-center justify-between gap-3 px-4">
          <div className="min-w-0 flex-1">
            <FeedBackButton />
            <nav className="mt-1 truncate text-sm text-muted-foreground">
              <Link href="/feed" className="hover:text-primary">
                Feed
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{post.title}</span>
            </nav>
          </div>
          <FeedShareButton title={post.title} />
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <FeedArticleView post={post} />
      </div>
    </div>
  );
}
