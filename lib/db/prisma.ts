import { PrismaClient } from '@prisma/client';
import { isTransientNetworkError } from '@/lib/http/public-error';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

async function reconnectPrisma(): Promise<void> {
  await prisma.$disconnect().catch(() => {});
  await prisma.$connect();
}

/** Neon idle timeout sonrası kopan bağlantıyı yeniler. */
export async function ensureDbConnection(): Promise<void> {
  if (!isDatabaseConfigured()) return;

  try {
    await prisma.$queryRaw`SELECT 1`;
    return;
  } catch (error) {
    if (!isTransientNetworkError(error)) throw error;
  }

  await reconnectPrisma();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    if (!isTransientNetworkError(error)) throw error;
    await reconnectPrisma();
    await prisma.$queryRaw`SELECT 1`;
  }
}

/** Kopuk Neon/Prisma bağlantısında işlemi bir kez daha dener. */
export async function withDbRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientNetworkError(error)) throw error;
    await reconnectPrisma();
    return operation();
  }
}
