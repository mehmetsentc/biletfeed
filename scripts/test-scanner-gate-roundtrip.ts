/**
 * Kapı kodu oluştur + doğrula roundtrip testi (Redis gerekmez).
 *
 * npx tsx scripts/test-scanner-gate-roundtrip.ts
 */
import {
  createScannerGateCode,
  isSixDigitGateInput,
  redeemScannerGateCode
} from '../lib/auth/scanner-gate';

function assert(label: string, ok: boolean) {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) process.exit(1);
}

async function main() {
  const created = await createScannerGateCode({
    organizerId: 'org-test-123',
    uid: 'uid-test-456',
    email: 'gate-staff@biletfeed.local',
    role: 'ROLE_ORGANIZER'
  });

  assert('redeemCode üretildi', created.redeemCode.includes('.'));
  assert('gate id 8 karakter', /^[A-Z2-9]{8}$/.test(created.pin));

  const full = await redeemScannerGateCode(created.redeemCode);
  assert('tam kod ile giriş', full?.email === 'gate-staff@biletfeed.local');

  const gateParam = `https://panel.biletfeed.com/giris?gate=${encodeURIComponent(created.redeemCode)}`;
  const fromUrl = await redeemScannerGateCode(gateParam);
  assert('URL ?gate= ile giriş', fromUrl?.organizerId === 'org-test-123');

  const sixOnly = await redeemScannerGateCode('963037');
  assert('6 haneli kısa giriş reddedilir', sixOnly === null);
  assert(
    '6 haneli input algılanır',
    isSixDigitGateInput('963037') && !isSixDigitGateInput(created.redeemCode)
  );

  const shortOnly = await redeemScannerGateCode(created.pin);
  assert(
    '8 karakter tek başına (redis yok) reddedilir veya imzalı kod gerekir',
    shortOnly === null || shortOnly.email === 'gate-staff@biletfeed.local'
  );

  console.log('\nRoundtrip OK:', {
    gateId: created.pin,
    redeemCodePreview: `${created.redeemCode.slice(0, 12)}…`,
    expiresAt: created.expiresAt.toISOString()
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
