import { BannerAdminPanel } from '@/components/admin/banner-admin-panel';
import { enforceAdminPageAccess } from '@/lib/auth/admin-api';

export default async function AdminBannersPage() {
  await enforceAdminPageAccess('/admin/bannerlar');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Banner yönetimi</h1>
        <p className="text-muted-foreground">
          Ana sayfa öne çıkan bannerlar — şehir seçimi, sabit (carousel’siz) öne
          çıkarma; mobil / tablet / web görselleri
        </p>
      </div>
      <BannerAdminPanel />
    </div>
  );
}
