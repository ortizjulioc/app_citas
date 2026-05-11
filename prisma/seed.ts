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

  const permisos = [
    { nombre: 'ver_citas_propias', descripcion: 'Ver sus propias citas' },
    { nombre: 'gestionar_citas_propias', descripcion: 'Atender o cancelar sus propias citas' },
    { nombre: 'ver_clientes', descripcion: 'Ver información de clientes' }
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

  const rolEmpleado = await prisma.rol.findFirst({ where: { nombre: 'empleado', deleted: false } })

  for (const permiso of permisos) {
    const existingPermiso = await prisma.permiso.findFirst({ where: { nombre: permiso.nombre, deleted: false } })
    let permisoCreado

    if (!existingPermiso) {
      permisoCreado = await prisma.permiso.create({ data: permiso })
      console.log(`✅ Created permiso: ${permiso.nombre}`)
    } else {
      console.log(`⏭️  Permiso already exists: ${permiso.nombre}`)
      permisoCreado = existingPermiso
    }

    if (rolEmpleado && permisoCreado) {
      const existingRelacion = await prisma.rolPermiso.findFirst({
        where: { rolId: rolEmpleado.id, permisoId: permisoCreado.id, deleted: false }
      })

      if (!existingRelacion) {
        await prisma.rolPermiso.create({
          data: { rolId: rolEmpleado.id, permisoId: permisoCreado.id }
        })
        console.log(`✅ Assigned permiso ${permiso.nombre} to rol empleado`)
      } else {
        console.log(`⏭️  Permiso ${permiso.nombre} already assigned to rol empleado`)
      }
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