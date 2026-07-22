import { getRedisClient } from '@/lib/redis';

const LOCK_KEY = 'einvoice:gib:session-lock';
const LOCK_TTL_SEC = 90;

/**
 * GİB portal tek oturum kabul ettiği için tüm API çağrılarını serialize eder.
 */
export async function withGibSessionLock<T>(fn: () => Promise<T>): Promise<T> {
  const redis = getRedisClient();
  if (!redis) {
    return fn();
  }

  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    const ok = await redis.set(LOCK_KEY, token, { nx: true, ex: LOCK_TTL_SEC });
    if (ok) {
      try {
        return await fn();
      } finally {
        const current = await redis.get<string>(LOCK_KEY);
        if (current === token) {
          await redis.del(LOCK_KEY);
        }
      }
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  throw new Error(
    'GİB oturumu meşgul — başka bir gönderim bitene kadar bekleyin, birkaç saniye sonra tekrar deneyin'
  );
}
