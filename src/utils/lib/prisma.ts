import { PrismaClient } from '../../generated/prisma'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL

// Usamos 'any' momentáneamente si el error persiste para saltar la validación de tipos cruzada
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool as any)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
