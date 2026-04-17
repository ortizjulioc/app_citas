import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool as any)

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting seed...')

  const roles = [
    { nombre: 'admin', descripcion: 'Administrador del negocio' },
    { nombre: 'cliente', descripcion: 'Cliente que agenda citas' },
    { nombre: 'empleado', descripcion: 'Empleado del negocio' }
  ]

  for (const rol of roles) {
    const existing = await prisma.rol.findFirst({ where: { nombre: rol.nombre, deleted: false } })
    if (!existing) {
      await prisma.rol.create({ data: rol })
      console.log(`✅ Created role: ${rol.nombre}`)
    } else {
      console.log(`⏭️  Role already exists: ${rol.nombre}`)
    }
  }

  console.log('✅ Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })