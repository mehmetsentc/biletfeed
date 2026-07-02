import assert from 'node:assert/strict';
import { resolveManualScanInput, normalizeTicketCode } from '../lib/tickets/sign';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`, e);
    process.exitCode = 1;
  }
}

test('normalizeTicketCode uppercase', () => {
  assert.equal(normalizeTicketCode('bf-a1b2c3d4'), 'BF-A1B2C3D4');
});

test('resolve BF code lowercase', () => {
  assert.deepEqual(resolveManualScanInput('bf-a1b2c3d4'), {
    ticketCode: 'BF-A1B2C3D4'
  });
});

test('resolve davetiye path', () => {
  const r = resolveManualScanInput('/davetiye/abc123def456');
  assert.equal(r.inviteToken, 'abc123def456');
});

test('resolve bilet path', () => {
  const r = resolveManualScanInput('/bilet/BF-ABCDEF12?token=xyz&id=uuid');
  assert.equal(r.ticketCode, 'BF-ABCDEF12');
  assert.equal(r.validationToken, 'xyz');
});

test('resolve invite hex token', () => {
  const token = 'a'.repeat(32);
  const r = resolveManualScanInput(token);
  assert.equal(r.inviteToken, token);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
console.log('\nManuel giriş parse testleri tamam.');
