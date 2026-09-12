const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const AUDIT_FN = fs.readFileSync(
  path.join(__dirname, 'live-audit.js'),
  'utf8'
);

const PAGES = [
  '/',
  '/feed',
  '/etkinlikler',
  '/kategoriler',
  '/hakkimizda',
  '/iletisim',
  '/sss',
  '/destek',
  '/gizlilik',
  '/kullanim-kosullari',
];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, isMobile: true },
  { name: 'tablet-portrait', width: 768, height: 1024, isMobile: true },
  { name: 'tablet-landscape', width: 1024, height: 768, isMobile: false },
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
];

const BASE = 'https://biletfeed.com';

async function dismissOverlays(page) {
  try {
    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button, a')];
      for (const b of buttons) {
        const t = (b.textContent || '').trim().toLowerCase();
        if (
          t.includes('kabul') ||
          t.includes('accept') ||
          t.includes('tamam') ||
          t.includes('anladım') ||
          t.includes('kapat')
        ) {
          b.click();
        }
      }
    });
  } catch {}
}

async function findEventDetailPath(page) {
  return page.evaluate(() => {
    const link = [...document.querySelectorAll('a[href*="/etkinlik/"]')].find(
      (a) => /\/etkinlik\/[^/?#]+/.test(a.getAttribute('href') || '')
    );
    return link ? link.getAttribute('href') : null;
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  const results = [];
  let eventPath = null;

  // Discover an event detail URL once
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/etkinlikler`, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  await dismissOverlays(page);
  eventPath = await findEventDetailPath(page);
  if (!eventPath) {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 60000 });
    eventPath = await findEventDetailPath(page);
  }

  const allPaths = [...PAGES];
  if (eventPath) allPaths.push(eventPath.split('?')[0]);

  for (const vp of VIEWPORTS) {
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });

    for (const p of allPaths) {
      const url = p.startsWith('http') ? p : `${BASE}${p}`;
      const entry = {
        viewport: vp.name,
        path: p,
        ok: false,
        status: null,
        error: null,
        audit: null,
        screenshotNote: null,
      };
      try {
        const resp = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        entry.status = resp ? resp.status() : null;
        await new Promise((r) => setTimeout(r, 1200));
        await dismissOverlays(page);
        // Wait a bit for images
        await new Promise((r) => setTimeout(r, 800));
        entry.audit = await page.evaluate(AUDIT_FN);
        entry.ok = true;

        // Extra: contrast fail count only kept in audit
        // Extra: check main landmark / skip link
        entry.extra = await page.evaluate(() => {
          const main = !!document.querySelector('main,[role="main"]');
          const skip = [...document.querySelectorAll('a')].some((a) =>
            /içeriğe atla|skip to/i.test(a.textContent || a.getAttribute('aria-label') || '')
          );
          const focusable = document.querySelectorAll(
            'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
          ).length;
          const theme =
            document.documentElement.className ||
            document.documentElement.getAttribute('data-theme') ||
            '';
          const cssVars = getComputedStyle(document.documentElement);
          const brandish = {
            background: cssVars.getPropertyValue('--background').trim() || null,
            foreground: cssVars.getPropertyValue('--foreground').trim() || null,
            primary: cssVars.getPropertyValue('--primary').trim() || null,
            accent: cssVars.getPropertyValue('--accent').trim() || null,
          };
          // visible nav mode
          const desktopNav = [...document.querySelectorAll('nav a, header a')].filter(
            (a) => {
              const r = a.getBoundingClientRect();
              return r.width > 0 && /Ana Sayfa|Etkinlikler|Akış/.test(a.textContent || '');
            }
          ).length;
          const hamburger = [...document.querySelectorAll('button')].some((b) => {
            const label = (
              b.getAttribute('aria-label') ||
              b.textContent ||
              ''
            ).toLowerCase();
            return /menü|menu|aç/.test(label);
          });
          return { main, skip, focusable, theme, brandish, desktopNav, hamburger };
        });
      } catch (e) {
        entry.error = String(e && e.message ? e.message : e);
      }
      results.push(entry);
      process.stdout.write(
        `${vp.name.padEnd(18)} ${String(entry.status || 'ERR').padEnd(4)} ${p}\n`
      );
    }
  }

  // robots + sitemap check via fetch in page
  const seoFiles = await page.evaluate(async () => {
    const out = {};
    for (const u of ['/robots.txt', '/sitemap.xml']) {
      try {
        const r = await fetch(u);
        const text = await r.text();
        out[u] = {
          status: r.status,
          length: text.length,
          sample: text.slice(0, 400),
        };
      } catch (e) {
        out[u] = { error: String(e) };
      }
    }
    return out;
  });

  const outPath = path.join(__dirname, 'live-audit-report.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        base: BASE,
        eventPath,
        seoFiles,
        results,
      },
      null,
      2
    )
  );
  console.log('Wrote', outPath, 'entries', results.length);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
