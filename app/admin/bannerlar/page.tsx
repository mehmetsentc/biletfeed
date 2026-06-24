import { BannerAdminPanel } from '@/components/admin/banner-admin-panel';

export default function AdminBannersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bannerlar</h1>
        <p className="text-muted-foreground">Ana sayfa promosyon bannerlarını yönetin</p>
      </div>
      <BannerAdminPanel />
    </div>
  );
}
