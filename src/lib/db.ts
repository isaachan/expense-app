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
      CREATE TABLE IF NOT EXISTS "InviteCode" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL,
        "note" TEXT NOT NULL DEFAULT '',
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "usedCount" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "InviteCode_code_key" UNIQUE ("code")
      );
    `)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OperationLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "action" TEXT NOT NULL,
        "detail" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Seed initial invite codes from env if no codes exist
    const count = await db.inviteCode.count()
    if (count === 0) {
      const seedCodes = process.env.INVITE_CODES
      if (seedCodes) {
        for (const code of seedCodes.split(',').map((c: string) => c.trim()).filter(Boolean)) {
          await db.inviteCode.create({ data: { code } })
        }
      }
    }

    globalForPrisma.dbInitialized = true
  } catch (error) {
    console.error('Failed to ensure database tables:', error)
  }
}

// Simple in-memory session store
const sessions = new Map<string, { role: string }>()

export function setSession(token: string, data: { role: string }) {
  sessions.set(token, data)
}

export function getSession(token: string) {
  return sessions.get(token)
}

export function removeSession(token: string) {
  sessions.delete(token)
}

export async function addLog(action: string, detail: string) {
  try {
    await db.operationLog.create({ data: { action, detail } })
  } catch (e) {
    console.error('Failed to write log:', e)
  }
}