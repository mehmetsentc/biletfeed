import { getAdminCategories } from '@/lib/services/admin-dashboard';
import { CategoryAdminPanel } from '@/components/admin/category-admin-panel';

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kategoriler</h1>
        <p className="text-muted-foreground">
          {categories.length} kategori — ad, görsel ve açıklama düzenle
        </p>
      </div>
      <CategoryAdminPanel categories={categories} />
    </div>
  );
}
