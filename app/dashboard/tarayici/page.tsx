import { getTranslations } from '@/lib/i18n';
import { QrScanner } from '@/components/tickets/qr-scanner';

const t = getTranslations();

export default function DashboardScannerPage() {
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
