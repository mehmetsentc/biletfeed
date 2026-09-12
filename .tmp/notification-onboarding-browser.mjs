import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:3000';

const browser = await puppeteer.launch({
  headless: false,
  executablePath:
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--window-size=1280,900', '--disable-features=TranslateUI'],
  defaultViewport: { width: 1280, height: 900 }
});

const context = browser.defaultBrowserContext();
await context.overridePermissions(BASE, ['notifications', 'geolocation']);

const page = await browser.newPage();
page.setDefaultTimeout(60000);

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  localStorage.removeItem('bf_notification_onboarding');
  localStorage.removeItem('bf_cookie_preferences');
  localStorage.removeItem('bf_newsletter_subscribed');
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith('bf-notification-prefs:')) localStorage.removeItem(k);
  }
  document.cookie = 'bf_cookie_consent=; path=/; max-age=0';
});
await page.reload({ waitUntil: 'networkidle2' });

const cookieAccept = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')];
  const accept = buttons.find((b) =>
    /kabul et|accept/i.test(b.textContent || '')
  );
  if (accept) {
    accept.click();
    return true;
  }
  return false;
});
console.log('cookieAccept', cookieAccept);

await new Promise((r) => setTimeout(r, 1800));

const cityPicked = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) return false;
  const btn = [...dialog.querySelectorAll('button')].find((b) => {
    const t = (b.textContent || '').trim();
    return t && !/kapat|close|vazgeç|iptal|şimdi değil/i.test(t) && t.length < 40;
  });
  if (btn) {
    btn.click();
    return btn.textContent?.trim() || true;
  }
  return false;
});
console.log('cityPicked', cityPicked);

await new Promise((r) => setTimeout(r, 1200));

let notificationAllow = false;
for (let i = 0; i < 20; i++) {
  notificationAllow = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')];
    const allow = buttons.find((b) =>
      /bildirimlere izin ver|allow notifications/i.test(b.textContent || '')
    );
    if (allow) {
      allow.click();
      return true;
    }
    return false;
  });
  if (notificationAllow) break;
  await new Promise((r) => setTimeout(r, 600));
}
console.log('notificationAllow', notificationAllow);

await new Promise((r) => setTimeout(r, 2000));

const state = await page.evaluate(() => ({
  onboarding: localStorage.getItem('bf_notification_onboarding'),
  guestPrefs: localStorage.getItem('bf-notification-prefs:guest'),
  cookie: document.cookie.includes('bf_cookie_consent'),
  notificationPermission:
    typeof Notification !== 'undefined'
      ? Notification.permission
      : 'unsupported',
  promptStillVisible: [...document.querySelectorAll('button')].some((b) =>
    /bildirimlere izin ver|allow notifications/i.test(b.textContent || '')
  )
}));
console.log('STATE', JSON.stringify(state, null, 2));

// Leave Chrome open for the user
await browser.disconnect();
console.log('DONE — Chrome left open');
