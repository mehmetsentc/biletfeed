import { FeedAdminDashboard } from '@/components/admin/feed-admin-dashboard';

export const metadata = {
  title: 'Feed Yönetimi'
};

export default function AdminFeedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feed Yönetimi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Haber oluşturma, görsel/video yükleme, AI kuyruğu ve yayın
        </p>
      </div>
      <FeedAdminDashboard />
    </div>
  );
}
