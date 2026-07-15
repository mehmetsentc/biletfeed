import { getServerTranslations } from '@/lib/i18n/server';
import { QrScanner } from '@/components/tickets/qr-scanner';

export default async function DashboardScannerPage() {
  const { t } = await getServerTranslations();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.dashboard.scanner}</h1>
        <p className="text-muted-foreground">
          Bilet QR kodunu tarayarak giriş kontrolü yapın
        </p>
      </div>
      <QrScanner />
    </div>
  );
}
