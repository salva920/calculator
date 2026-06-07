import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

function isRetryablePrismaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; message?: string; meta?: { message?: string } }
  const msg = `${e.message || ''} ${e.meta?.message || ''}`
  return (
    e.code === 'P2010' ||
    msg.includes('RetryableWriteError') ||
    msg.includes('fatal alert') ||
    msg.includes('Connection pool') ||
    msg.includes('I/O error')
  )
}

function createPrismaClient() {
  const base = new PrismaClient()
  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        const maxRetries = 3
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await query(args)
          } catch (error) {
            if (!isRetryablePrismaError(error) || attempt === maxRetries - 1) {
              throw error
            }
            await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** attempt))
          }
        }
        throw new Error('Prisma retry agotado')
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
