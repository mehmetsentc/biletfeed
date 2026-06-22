import { AdminOrdersPanel } from '@/components/admin/orders-panel';

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">İşlemler</h1>
        <p className="text-muted-foreground">
          Ödeme ve iade işlemlerini takip edin.
        </p>
      </div>
      <AdminOrdersPanel />
    </div>
  );
}
