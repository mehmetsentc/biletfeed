import { AdminTicketSearch } from '@/components/admin/ticket-search';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Bilet Yönetimi',
  path: '/admin/biletler'
});

export default function AdminTicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bilet Yönetimi</h1>
        <p className="text-muted-foreground">
          Kod, isim, e-posta veya token ile bilet arayın
        </p>
      </div>
      <AdminTicketSearch />
    </div>
  );
}
