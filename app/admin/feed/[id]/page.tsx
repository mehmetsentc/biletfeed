import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FeedEditorForm } from '@/components/admin/feed-editor-form';
import { getAdminFeedPostById, listFeedCategoriesForAdmin } from '@/lib/services/feed';
import { adminHref } from '@/lib/config/domain';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const post = await getAdminFeedPostById(id);
  return { title: post ? `Düzenle: ${post.title}` : 'Haber bulunamadı' };
}

export default async function AdminFeedEditPage({ params }: PageProps) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    getAdminFeedPostById(id),
    listFeedCategoriesForAdmin()
  ]);

  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Haberi Düzenle</h1>
          <p className="text-sm text-muted-foreground">{post.slug}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={adminHref('/feed')}>← Feed listesi</Link>
        </Button>
      </div>
      <FeedEditorForm mode="edit" post={post} categories={categories} />
    </div>
  );
}
