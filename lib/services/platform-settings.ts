import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import {
  FALLBACK_DEFAULT_COMMISSION_RATE,
  PLATFORM_SETTING_KEY_DEFAULT_COMMISSION_RATE,
  parseCommissionRate
} from '@/lib/config/commission';

export async function getPlatformSetting(key: string): Promise<string | null> {
  await ensureDbConnection();
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setPlatformSetting(key: string, value: string): Promise<void> {
  await ensureDbConnection();
  await prisma.platformSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value }
  });
}

export async function getDefaultCommissionRate(): Promise<number> {
  const stored = await getPlatformSetting(PLATFORM_SETTING_KEY_DEFAULT_COMMISSION_RATE);
  const parsed = parseCommissionRate(stored);
  if (parsed != null) return parsed;

  const envRate = parseCommissionRate(process.env.DEFAULT_COMMISSION_RATE);
  if (envRate != null) return envRate;

  return FALLBACK_DEFAULT_COMMISSION_RATE;
}

export async function setDefaultCommissionRate(rate: number): Promise<void> {
  await setPlatformSetting(
    PLATFORM_SETTING_KEY_DEFAULT_COMMISSION_RATE,
    String(rate)
  );
}
