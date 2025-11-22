import { PrismaClient, Prisma } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({} as Prisma.PrismaClientOptions)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
