import { PrismaClient } from '../prisma-client/index.js';
import { env } from './env.js';

const globalForPrisma = globalThis as unknown as { eduPrisma?: PrismaClient };

/** Отдельный клиент для схемы `edu` (сгенерирован из prisma/edu/schema.prisma). */
export const prisma =
  globalForPrisma.eduPrisma ??
  new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.eduPrisma = prisma;
}
