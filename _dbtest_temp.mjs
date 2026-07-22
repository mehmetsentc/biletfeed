import { config } from 'dotenv';
config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const r = await Promise.race([
    prisma.$queryRaw`SELECT 1 as ok`,
    new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_10s')), 10000))
  ]);
  console.log('OK', r);
} catch (e) {
  console.log('ERR', e.message);
} finally {
  await prisma.$disconnect();
}
