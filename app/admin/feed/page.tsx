import Link from 'next/link';
import { FeedAdminDashboard } from '@/components/admin/feed-admin-dashboard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Feed Yönetimi'
};

export default function AdminFeedPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feed Yönetimi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Haber oluşturma, görsel/video yükleme, AI kuyruğu ve yayın
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/feed/yeni">
            <Plus className="mr-2 size-4" />
            Yeni Haber
          </Link>
        </Button>
      </div>
      <FeedAdminDashboard />
    </div>
  );
}
