import { PrismaClient } from '@prisma/client';

const defaultDbUrl = 'postgresql://allyoutuber_user:t6RzLXcfEfl71jpobMuZXHNKn5HCh0VK@dpg-datts00u01pc73ah2800-a/allyoutuber';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = defaultDbUrl;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || defaultDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
