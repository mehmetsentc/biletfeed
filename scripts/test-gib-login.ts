/**
 * One-off GİB login smoke test. Run:
 *   node --env-file=.env.local --import tsx scripts/test-gib-login.ts
 */
import { getEInvoiceConfig } from '../lib/accounting/einvoice/config';
import { verifyGibEarsivLogin } from '../lib/accounting/einvoice/providers/gib-earsiv';

async function main() {
  const cfg = getEInvoiceConfig();
  console.log(
    JSON.stringify({
      provider: cfg.provider,
      sandbox: cfg.sandbox,
      userSet: Boolean(cfg.username)
    })
  );
  const r = await verifyGibEarsivLogin(cfg);
  console.log(
    JSON.stringify({ ok: r.ok, unvan: r.unvan, vkn: r.vkn, error: r.error })
  );
  process.exit(r.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
