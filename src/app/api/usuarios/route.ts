import { NextResponse } from 'next/server'
import prisma from '@/utils/lib/prisma'
import { usuarioSchema } from '@/app/schemas/usuario.schema'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 1. Validar con Yup
    const validatedData = await usuarioSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    // 2. Verificar si el email ya existe (Prisma no lo hace automáticamente antes de intentar insertar)
    const existe = await prisma.usuario.findUnique({
      where: { email: validatedData.email }
    })

    if (existe) {
      return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 400 })
    }

    // 3. HASHEAR LA CONTRASEÑA
    // El "10" es el costo del salt; un equilibrio perfecto entre seguridad y velocidad
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // 4. Crear el usuario con la contraseña protegida
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        ...validatedData,
        password: hashedPassword // Sobrescribimos la plana con la hasheada
      }
    })

    // 5. Seguridad: Eliminar la contraseña del objeto de respuesta
    const { password, ...usuarioSinPassword } = nuevoUsuario

    return NextResponse.json(usuarioSinPassword, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Error de validación', detalles: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

//-------------------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''

    // Construimos el objeto de condiciones
    const where: any = {
      deleted: false // <-- Siempre filtramos los que no están borrados
    }

    // Si hay búsqueda, la añadimos como una intersección (AND)
    if (search) {
      where.AND = [
        {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { apellido: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        // Tip: No devuelvas la contraseña en el listado
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
          createdAt: true,
          negocioId: true
        }
      }),
      prisma.usuario.count({ where })
    ])

    return NextResponse.json(
      {
        usuarios,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit)
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
