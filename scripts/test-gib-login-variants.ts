/**
 * Diagnose GİB login variants.
 * node --env-file=.env.local --import tsx scripts/test-gib-login-variants.ts
 */
import { getEInvoiceConfig } from '../lib/accounting/einvoice/config';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function tryLogin(
  base: string,
  fields: Record<string, string>
): Promise<Record<string, unknown>> {
  const res = await fetch(`${base}/earsiv-services/assos-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Accept: '*/*',
      'User-Agent': UA,
      Referer: `${base}/intragiris.html`
    },
    body: new URLSearchParams(fields)
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { rawText: text.slice(0, 200), httpStatus: res.status };
  }
}

async function main() {
  const cfg = getEInvoiceConfig();
  const base = cfg.sandbox
    ? 'https://earsivportaltest.efatura.gov.tr'
    : 'https://earsivportal.efatura.gov.tr';

  const variants = [
    {
      name: 'prod-anologin-parola1',
      fields: {
        assoscmd: 'anologin',
        rtype: 'json',
        userid: cfg.username,
        sifre: cfg.password,
        sifre2: cfg.password,
        parola: '1'
      }
    },
    {
      name: 'prod-anologin-parola=pass',
      fields: {
        assoscmd: 'anologin',
        rtype: 'json',
        userid: cfg.username,
        sifre: cfg.password,
        sifre2: cfg.password,
        parola: cfg.password
      }
    },
    {
      name: 'prod-login-parola1',
      fields: {
        assoscmd: 'login',
        rtype: 'json',
        userid: cfg.username,
        sifre: cfg.password,
        sifre2: cfg.password,
        parola: '1'
      }
    }
  ];

  for (const v of variants) {
    const r = await tryLogin(base, v.fields);
    console.log(
      JSON.stringify({
        variant: v.name,
        hasToken: typeof r.token === 'string' && r.token.length > 10,
        error: r.error,
        messages: r.messages,
        keys: Object.keys(r)
      })
    );
    if (typeof r.token === 'string' && r.token.length > 10) {
      await tryLogin(base, {
        assoscmd: 'logout',
        rtype: 'json',
        token: r.token
      });
      process.exit(0);
    }
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
