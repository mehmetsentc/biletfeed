/**
 * Kapı kodu oluştur + doğrula roundtrip testi.
 * Kısa kod DB'de saklanır → çalıştırmak için .env.local DATABASE_URL gerekir.
 *
 * npx dotenv -e .env.local -- tsx scripts/test-scanner-gate-roundtrip.ts
 */
import {
  createScannerGateCode,
  isSixDigitGateInput,
  redeemScannerGateCode,
  SCANNER_GATE_SHORT_CODE_LENGTH
} from '../lib/auth/scanner-gate';

const TEST_EVENT_ID = '00000000-0000-4000-8000-000000000001';
const TEST_ORG_ID = '00000000-0000-4000-8000-0000000000aa';

function assert(label: string, ok: boolean) {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) process.exit(1);
}

async function main() {
  const created = await createScannerGateCode({
    organizerId: TEST_ORG_ID,
    eventId: TEST_EVENT_ID,
    uid: 'uid-test-456',
    email: 'gate-staff@biletfeed.local',
    role: 'ROLE_ORGANIZER'
  });

  const codePattern = new RegExp(`^[A-Z2-9]{${SCANNER_GATE_SHORT_CODE_LENGTH}}$`);
  assert('kısa kod üretildi', codePattern.test(created.redeemCode));
  assert('pin ile redeemCode aynı', created.pin === created.redeemCode);

  const full = await redeemScannerGateCode(created.redeemCode);
  assert('kısa kod ile giriş', full?.email === 'gate-staff@biletfeed.local');
  assert('etkinlik kapsamı', full?.eventId === TEST_EVENT_ID);

  const gateParam = `https://giris.biletfeed.com/?gate=${encodeURIComponent(created.redeemCode)}`;
  const fromUrl = await redeemScannerGateCode(gateParam);
  assert('URL ?gate= ile giriş', fromUrl?.organizerId === TEST_ORG_ID);

  const lower = await redeemScannerGateCode(created.redeemCode.toLowerCase());
  assert('küçük harf kod da çalışır', lower?.eventId === TEST_EVENT_ID);

  const sixOnly = await redeemScannerGateCode('963037');
  assert('6 haneli kısa giriş reddedilir', sixOnly === null);
  assert(
    '6 haneli input algılanır',
    isSixDigitGateInput('963037') && !isSixDigitGateInput(created.redeemCode)
  );

  console.log('\nRoundtrip OK:', {
    code: created.pin,
    expiresAt: created.expiresAt.toISOString()
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
