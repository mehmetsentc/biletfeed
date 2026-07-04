/** EventJoy — küçük etkinlik / davetiye modülü (varsayılan: kapalı) */
export const isEventJoyEnabled =
  process.env.NEXT_PUBLIC_ENABLE_EVENTJOY === 'true';

/** Harici platform scraper (varsayılan: kapalı — SCRAPER_ENABLED=true ile açılır) */
export const isScraperEnabled = process.env.SCRAPER_ENABLED === 'true';

/** Apple / Google Wallet pass üretimi (varsayılan: kapalı — WALLET_ENABLED=true) */
export const isWalletEnabled = process.env.WALLET_ENABLED === 'true';
