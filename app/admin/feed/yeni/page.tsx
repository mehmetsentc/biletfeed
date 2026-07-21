import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FeedEditorForm } from '@/components/admin/feed-editor-form';
import { listFeedCategoriesForAdmin } from '@/lib/services/feed';
import { adminHref } from '@/lib/config/domain';

export const metadata = { title: 'Yeni Feed Haberi' };

export default async function AdminFeedNewPage() {
  const categories = await listFeedCategoriesForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Yeni Haber Oluştur</h1>
          <p className="text-sm text-muted-foreground">
            Kapak görseli, galeri, video ve metin — feed&apos;e manuel haber ekleyin
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={adminHref('/feed')}>← Feed listesi</Link>
        </Button>
      </div>
      <FeedEditorForm mode="create" categories={categories} />
    </div>
  );
}
