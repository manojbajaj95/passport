import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import ws from 'ws'
import { PrismaClient as SqlitePrismaClient } from '@/generated/prisma/client'
import { PrismaClient as PostgresPrismaClient } from '@/generated/prisma-postgres/client'

type AppPrismaClient = SqlitePrismaClient

const globalForPrisma = globalThis as unknown as { prisma: AppPrismaClient }

function createPrismaClient(): AppPrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db'

  if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
    neonConfig.webSocketConstructor = ws
    const adapter = new PrismaNeon({ connectionString: databaseUrl })
    return new PostgresPrismaClient({ adapter }) as unknown as AppPrismaClient
  }

  const adapter = new PrismaBetterSqlite3({ url: databaseUrl })
  return new SqlitePrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
