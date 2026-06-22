import { QrScanner } from '@/components/tickets/qr-scanner';

export default function OrganizatorScannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800">Bilet Gişesi</h1>
        <p className="text-sm text-zinc-600">
          Bilet QR kodunu tarayarak giriş kontrolü yapın
        </p>
      </div>
      <QrScanner />
    </div>
  );
}
