import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbInitialized: boolean
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export async function ensureDb() {
  if (globalForPrisma.dbInitialized) return
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Expense" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "date" TIMESTAMP(3) NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "category" TEXT NOT NULL,
        "note" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );
    `)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WhitelistUser" (
        "openid" TEXT NOT NULL PRIMARY KEY,
        "nickname" TEXT NOT NULL DEFAULT '',
        "avatar" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    globalForPrisma.dbInitialized = true
  } catch (error) {
    console.error('Failed to ensure database tables:', error)
  }
}

// Simple session store (in-memory, works for single instance)
const sessions = new Map<string, { openid: string; nickname: string; avatar: string }>()

export function setSession(token: string, user: { openid: string; nickname: string; avatar: string }) {
  sessions.set(token, user)
}

export function getSession(token: string) {
  return sessions.get(token)
}

export function removeSession(token: string) {
  sessions.delete(token)
}