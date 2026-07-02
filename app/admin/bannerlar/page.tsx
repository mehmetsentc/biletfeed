import { BannerAdminPanel } from '@/components/admin/banner-admin-panel';
import { enforceAdminPageAccess } from '@/lib/auth/admin-api';

export default async function AdminBannersPage() {
  await enforceAdminPageAccess('/admin/bannerlar');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Öne Çıkan Bannerlar</h1>
        <p className="text-muted-foreground">
          Ana sayfa carousel — mobil, tablet ve web için ayrı görseller
        </p>
      </div>
      <BannerAdminPanel />
    </div>
  );
}
