import { PrismaClient } from '@prisma/client';

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

function isStaleConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('kind: Closed') ||
    message.includes('Connection terminated') ||
    message.includes('ECONNRESET') ||
    message.includes('connection closed')
  );
}

/** Neon idle timeout sonrası kopan bağlantıyı yeniler. */
export async function ensureDbConnection(): Promise<void> {
  if (!isDatabaseConfigured()) return;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    if (!isStaleConnectionError(error)) throw error;
    await prisma.$disconnect().catch(() => {});
    await prisma.$connect();
  }
}
