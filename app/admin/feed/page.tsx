import { FeedAdminDashboard } from '@/components/admin/feed-admin-dashboard';

export const metadata = {
  title: 'Feed Yönetimi'
};

export default function AdminFeedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feed Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          BiletFeed AI Editor kuyruğu, editoryal inceleme ve yayın yönetimi
        </p>
      </div>
      <FeedAdminDashboard />
    </div>
  );
}
