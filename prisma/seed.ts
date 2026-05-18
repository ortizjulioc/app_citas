import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

// ─── Helpers ──────────────────────────────────────────────────────────────────

const t = (hh: number, mm = 0) =>
  new Date(`1970-01-01T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00Z`)

const DIAS_LV  = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES'] as const
const DIAS_LS  = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'] as const
const DIAS_TODO = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'] as const

async function main() {
  const PASS = await bcrypt.hash('123456', 10)
  console.log('🌱 Seed iniciado — password universal: 123456\n')

  // ─── ROLES (globales) ──────────────────────────────────────────────────────

  const roles = {
    admin:    await prisma.rol.upsert({ where: { nombre: 'admin' },    update: {}, create: { nombre: 'admin',    descripcion: 'Administrador con acceso total' } }),
    cajero:   await prisma.rol.upsert({ where: { nombre: 'cajero' },   update: {}, create: { nombre: 'cajero',   descripcion: 'Cajero / Punto de venta' } }),
    empleado: await prisma.rol.upsert({ where: { nombre: 'empleado' }, update: {}, create: { nombre: 'empleado', descripcion: 'Empleado / Estilista / Técnico' } }),
    cliente:  await prisma.rol.upsert({ where: { nombre: 'cliente' },  update: {}, create: { nombre: 'cliente',  descripcion: 'Cliente que agenda citas' } }),
  }
  console.log('✅ Roles globales')

  // ─── HELPER: crear usuario y asignar rol ──────────────────────────────────

  async function upsertUsuario(email: string, nombre: string, apellido: string, negocioId: string | null, rol: any) {
    const u = await prisma.usuario.upsert({
      where: { email },
      update: {},
      create: { email, password: PASS, nombre, apellido, negocioId }
    })
    await prisma.usuarioRol.upsert({
      where: { usuarioId_rolId: { usuarioId: u.id, rolId: rol.id } },
      update: {}, create: { usuarioId: u.id, rolId: rol.id }
    })
    return u
  }

  // ─── HELPER: crear negocio completo ───────────────────────────────────────

  async function upsertNegocio(data: {
    nombre: string, descripcion: string, telefono: string, email: string,
    direccion: string, categoria: any, RNC: string, conItbis?: boolean
  }) {
    let n = await prisma.negocio.findFirst({ where: { nombre: data.nombre, deleted: false } })
    if (!n) n = await prisma.negocio.create({ data: {
      nombre: data.nombre, descripcion: data.descripcion, RNC: data.RNC,
      telefono: data.telefono, email: data.email, direccion: data.direccion,
      categoriaServicio: data.categoria,
      facturarConItbis: data.conItbis || false, tasaItbis: 0.18,
    }})
    await prisma.secuenciaFactura.upsert({
      where: { negocioId: n.id }, update: {}, create: { negocioId: n.id, ultimoNumero: 0 }
    })
    return n
  }

  async function upsertSucursal(nombre: string, negocioId: string, diasHorario: readonly string[], inicio: number, fin: number) {
    const s = await prisma.sucursal.upsert({
      where: { negocioId_nombre: { negocioId, nombre } },
      update: {}, create: { nombre, negocioId }
    })
    const existentes = await prisma.horarioSucursal.count({ where: { sucursalId: s.id } })
    if (existentes === 0) {
      await prisma.horarioSucursal.createMany({
        data: diasHorario.map(d => ({ sucursalId: s.id, diaSemana: d as any, horaInicio: t(inicio), horaFin: t(fin), activo: true }))
      })
    }
    return s
  }

  async function upsertServicio(nombre: string, descripcion: string, duracion: number, negocioId: string, precios: Array<{ sucursalId: string, precio: number }>) {
    let srv = await prisma.servicio.findFirst({ where: { nombre, negocioId, deleted: false } })
    if (!srv) srv = await prisma.servicio.create({ data: { nombre, descripcion, duracionMinutos: duracion, negocioId } })
    for (const p of precios) {
      await prisma.servicioSucursal.upsert({
        where: { servicioId_sucursalId: { servicioId: srv.id, sucursalId: p.sucursalId } },
        update: { precio: p.precio },
        create: { servicioId: srv.id, sucursalId: p.sucursalId, precio: p.precio, costo: Math.round(p.precio * 0.35), activo: true }
      })
    }
    return srv
  }

  async function upsertEmpleado(nombre: string, apellido: string, email: string, telefono: string, sucursalId: string, negocioId: string, salario: any, salarioBase: number | null, dias: readonly string[], horaI: number, horaF: number) {
    let e = await prisma.empleado.findFirst({ where: { email, deleted: false } })
    if (!e) e = await prisma.empleado.create({ data: { nombre, apellido, email, telefono, tipoSalario: salario, salarioBase, sucursalId, negocioId, fechaContratacion: new Date('2024-01-15') } })
    const ex = await prisma.horarioEmpleado.count({ where: { empleadoId: e.id, deleted: false } })
    if (ex === 0) {
      await prisma.horarioEmpleado.createMany({
        data: dias.map(d => ({ empleadoId: e!.id, diaSemana: d as any, horaInicio: t(horaI), horaFin: t(horaF) }))
      })
    }
    return e
  }

  async function asignarServicioEmpleado(empleadoId: string, servicioId: string) {
    const ex = await prisma.servicioEmpleado.findFirst({ where: { empleadoId, servicioId, deleted: false } })
    if (!ex) await prisma.servicioEmpleado.create({ data: { empleadoId, servicioId } })
  }

  async function upsertCliente(nombre: string, apellido: string, telefono: string, email: string | null, negocioId: string) {
    let cli = await prisma.cliente.findFirst({ where: { telefono, deleted: false } })
    if (!cli) cli = await prisma.cliente.create({ data: { nombre, apellido, telefono, email } })
    await prisma.clienteNegocio.upsert({
      where: { clienteId_negocioId: { clienteId: cli.id, negocioId } },
      update: {}, create: { clienteId: cli.id, negocioId, totalGastado: 0 }
    })
    return cli
  }

  async function upsertMetodoPago(nombre: string, descripcion: string, esEfectivo: boolean, negocioId: string) {
    let m = await prisma.metodoPago.findFirst({ where: { nombre, negocioId, deleted: false } })
    if (!m) m = await prisma.metodoPago.create({ data: { nombre, descripcion, esEfectivo, negocioId } })
    return m
  }

  async function crearCajaConSesion(nombre: string, sucursalId: string, negocioId: string, abiertoPorId: string) {
    let caja = await prisma.caja.findFirst({ where: { nombre, negocioId, deleted: false } })
    if (!caja) caja = await prisma.caja.create({ data: { nombre, sucursalId, negocioId, estado: 'CERRADA' } })

    const sesAbierta = await prisma.sesionCaja.findFirst({ where: { cajaId: caja.id, horaCierre: null, deleted: false } })
    if (!sesAbierta) {
      const ses = await prisma.sesionCaja.create({ data: {
        cajaId: caja.id, negocioId, abiertoPorId,
        montoApertura: 2000, horaApertura: new Date('2026-05-18T08:00:00Z'),
      }})
      await prisma.caja.update({ where: { id: caja.id }, data: { estado: 'ABIERTA' } })
      return { caja, sesion: ses }
    }
    return { caja, sesion: sesAbierta }
  }

  // ─── FACTORY: crear cita ─────────────────────────────────────────────────

  async function crearCita(clienteId: string, empleadoId: string, sucursalId: string, inicio: Date, durMin: number, estado: any, servicioIds: string[]) {
    const ex = await prisma.cita.findFirst({ where: { clienteId, empleadoId, inicio, deleted: false } })
    if (ex) return ex
    const fin = new Date(inicio.getTime() + durMin * 60000)
    const cita = await prisma.cita.create({ data: {
      clienteId, empleadoId, sucursalId, inicio, fin, estado,
      servicioCitas: { create: servicioIds.map(id => ({ servicioId: id })) }
    }})
    await prisma.historialCita.create({ data: { citaId: cita.id, estado } })
    return cita
  }

  // ─── FACTORY: crear factura + pago ───────────────────────────────────────

  async function crearFactura(opts: {
    negocioId: string, clienteId: string, sucursalId: string, createdBy: string,
    citaId?: string, sesionId?: string, metodoPagoId?: string,
    items: { tipo: 'SERVICIO' | 'PRODUCTO', refId: string, nombre: string, precio: number }[],
    desc?: number, estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA'
  }) {
    const seq = await prisma.secuenciaFactura.update({ where: { negocioId: opts.negocioId }, data: { ultimoNumero: { increment: 1 } } })
    const num = `FAC-2026-${String(seq.ultimoNumero).padStart(5, '0')}`

    const subtotal = opts.items.reduce((a, i) => a + i.precio, 0)
    const desc = opts.desc || 0
    const total = subtotal - desc
    const montoPagado = opts.estado === 'PAGADA' ? total : opts.estado === 'PARCIAL' ? Math.round(total * 0.5) : 0

    const f = await prisma.factura.create({ data: {
      numeroFactura: num, clienteId: opts.clienteId, citaId: opts.citaId || null,
      sucursalId: opts.sucursalId, negocioId: opts.negocioId,
      subtotal, descuentos: desc, tasaItbis: 0, itbisAplicado: 0,
      total, montoPagado, estado: opts.estado, createdBy: opts.createdBy,
      detalleFacturas: {
        create: opts.items.map(i => ({
          tipo: i.tipo,
          servicioId: i.tipo === 'SERVICIO' ? i.refId : null,
          productoId: i.tipo === 'PRODUCTO' ? i.refId : null,
          descripcion: i.nombre, cantidad: 1,
          precioUnitario: i.precio, descuento: 0, subtotal: i.precio
        }))
      }
    }})

    if (montoPagado > 0 && opts.metodoPagoId) {
      const pago = await prisma.pago.create({ data: {
        facturaId: f.id, metodoPagoId: opts.metodoPagoId,
        sesionCajaId: opts.sesionId || null, monto: montoPagado,
        estado: 'COMPLETADO', negocioId: opts.negocioId, createdBy: opts.createdBy
      }})

      if (opts.sesionId) {
        const mp = await prisma.metodoPago.findUnique({ where: { id: opts.metodoPagoId } })
        if (mp?.esEfectivo) {
          await prisma.movimientoCaja.create({ data: {
            sesionCajaId: opts.sesionId, tipo: 'INGRESO', monto: montoPagado,
            descripcion: `Cobro ${num}`, negocioId: opts.negocioId,
            pagoId: pago.id, metodoPagoId: opts.metodoPagoId
          }})
        }
      }

      await prisma.clienteNegocio.update({
        where: { clienteId_negocioId: { clienteId: opts.clienteId, negocioId: opts.negocioId } },
        data: { totalGastado: { increment: montoPagado }, ultimaVisita: new Date() }
      })
    }
    return f
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EMPRESA 1: Peluquería Bella (Belleza) — Santo Domingo
  // ══════════════════════════════════════════════════════════════════════════

  console.log('\n📍 Empresa 1: Peluquería Bella')

  const neg1 = await upsertNegocio({ nombre: 'Peluquería Bella', descripcion: 'Salón de belleza y barbería', RNC: '1-31-12345-6', telefono: '809-555-0100', email: 'info@peluqueriabella.com.do', direccion: 'Av. Independencia #45, Santo Domingo', categoria: 'BELLEZA' })

  const [u1Admin, u1Cajero] = await Promise.all([
    upsertUsuario('admin@bella.com', 'Carlos', 'Méndez', neg1.id, roles.admin),
    upsertUsuario('cajero@bella.com', 'Luisa', 'Fernández', neg1.id, roles.cajero),
  ])

  const [s1A, s1B] = await Promise.all([
    upsertSucursal('Bella Principal', neg1.id, DIAS_LS, 8, 20),
    upsertSucursal('Bella Norte', neg1.id, DIAS_LS, 9, 19),
  ])

  const [srv1_1, srv1_2, srv1_3, srv1_4, srv1_5, srv1_6] = await Promise.all([
    upsertServicio('Corte Caballero',     'Corte clásico para hombre',             30,  neg1.id, [{ sucursalId: s1A.id, precio: 350 }, { sucursalId: s1B.id, precio: 300 }]),
    upsertServicio('Corte Dama',          'Corte y peinado para mujer',             45,  neg1.id, [{ sucursalId: s1A.id, precio: 550 }, { sucursalId: s1B.id, precio: 500 }]),
    upsertServicio('Tinte Completo',      'Tinte profesional en todo el cabello',  120,  neg1.id, [{ sucursalId: s1A.id, precio: 1500 },{ sucursalId: s1B.id, precio: 1400}]),
    upsertServicio('Barba y Bigote',      'Arreglo de barba con navaja',            20,  neg1.id, [{ sucursalId: s1A.id, precio: 200 }, { sucursalId: s1B.id, precio: 180 }]),
    upsertServicio('Manicure',            'Limpieza y esmaltado de uñas manos',     45,  neg1.id, [{ sucursalId: s1A.id, precio: 400 }, { sucursalId: s1B.id, precio: 380 }]),
    upsertServicio('Tratamiento Capilar', 'Hidratación profunda con proteínas',     60,  neg1.id, [{ sucursalId: s1A.id, precio: 800 }, { sucursalId: s1B.id, precio: 750 }]),
  ])

  const [e1_1, e1_2, e1_3] = await Promise.all([
    upsertEmpleado('Pedro', 'Ramírez',  'pedro@bella.com',  '809-001-0001', s1A.id, neg1.id, 'POR_COMISION', null,  DIAS_LS, 8, 20),
    upsertEmpleado('María', 'Santos',   'maria@bella.com',  '809-001-0002', s1A.id, neg1.id, 'POR_COMISION', null,  DIAS_LS, 8, 20),
    upsertEmpleado('Ana',   'López',    'ana@bella.com',    '809-001-0003', s1B.id, neg1.id, 'FIJO',         18000, DIAS_LS, 9, 18),
  ])

  for (const [empId, srvs] of [[e1_1.id,[srv1_1,srv1_4,srv1_6]],[e1_2.id,[srv1_2,srv1_3,srv1_6]],[e1_3.id,[srv1_5,srv1_1]]]) {
    for (const s of srvs as any[]) await asignarServicioEmpleado(empId as string, s.id)
  }

  const clis1 = await Promise.all([
    upsertCliente('Juan',     'García',   '829-201-0001', 'juan@gmail.com',    neg1.id),
    upsertCliente('Rosa',     'Martínez', '849-201-0002', 'rosa@gmail.com',    neg1.id),
    upsertCliente('Miguel',   'Herrera',  '829-201-0003', null,                neg1.id),
    upsertCliente('Carmen',   'Díaz',     '809-201-0004', 'carmen@gmail.com',  neg1.id),
    upsertCliente('Luis',     'Torres',   '829-201-0005', null,                neg1.id),
    upsertCliente('Patricia', 'Vásquez',  '849-201-0006', 'paty@gmail.com',    neg1.id),
  ])

  const mp1Ef = await upsertMetodoPago('Efectivo',           'Pago en efectivo',        true,  neg1.id)
  const mp1TC = await upsertMetodoPago('Tarjeta Crédito',    'Visa / Mastercard',       false, neg1.id)
  const mp1Tr = await upsertMetodoPago('Transferencia',      'Pago móvil / banco',      false, neg1.id)

  const { sesion: ses1 } = await crearCajaConSesion('Caja Bella Principal', s1A.id, neg1.id, u1Cajero.id)

  // Citas y facturas empresa 1
  const c1_1 = await crearCita(clis1[0].id, e1_1.id, s1A.id, new Date('2026-05-17T09:00:00Z'), 50,  'FINALIZADA', [srv1_1.id, srv1_4.id])
  const c1_2 = await crearCita(clis1[1].id, e1_2.id, s1A.id, new Date('2026-05-17T10:00:00Z'), 120, 'FINALIZADA', [srv1_3.id])
  const c1_3 = await crearCita(clis1[2].id, e1_1.id, s1A.id, new Date('2026-05-17T15:00:00Z'), 30,  'CANCELADA',  [srv1_1.id])
  const c1_4 = await crearCita(clis1[3].id, e1_3.id, s1B.id, new Date('2026-05-18T09:00:00Z'), 45,  'FINALIZADA', [srv1_5.id])
  const c1_5 = await crearCita(clis1[4].id, e1_1.id, s1A.id, new Date('2026-05-18T08:30:00Z'), 30,  'FINALIZADA', [srv1_1.id])
  const c1_6 = await crearCita(clis1[5].id, e1_2.id, s1A.id, new Date('2026-05-18T09:00:00Z'), 105, 'FINALIZADA', [srv1_2.id, srv1_6.id])
  await crearCita(clis1[0].id, e1_1.id, s1A.id, new Date('2026-05-18T11:00:00Z'), 30, 'CONFIRMADA', [srv1_1.id])
  await crearCita(clis1[1].id, e1_2.id, s1A.id, new Date('2026-05-19T10:00:00Z'), 45, 'PENDIENTE',  [srv1_2.id])

  await crearFactura({ negocioId: neg1.id, clienteId: clis1[0].id, sucursalId: s1A.id, citaId: c1_1.id, createdBy: u1Admin.id, sesionId: ses1.id, metodoPagoId: mp1Ef.id, items: [{ tipo: 'SERVICIO', refId: srv1_1.id, nombre: 'Corte Caballero', precio: 350 },{ tipo: 'SERVICIO', refId: srv1_4.id, nombre: 'Barba y Bigote', precio: 200 }], estado: 'PAGADA' })
  await crearFactura({ negocioId: neg1.id, clienteId: clis1[1].id, sucursalId: s1A.id, citaId: c1_2.id, createdBy: u1Admin.id, sesionId: ses1.id, metodoPagoId: mp1TC.id, items: [{ tipo: 'SERVICIO', refId: srv1_3.id, nombre: 'Tinte Completo', precio: 1500 }], estado: 'PAGADA' })
  await crearFactura({ negocioId: neg1.id, clienteId: clis1[3].id, sucursalId: s1B.id, citaId: c1_4.id, createdBy: u1Admin.id, metodoPagoId: mp1Ef.id, items: [{ tipo: 'SERVICIO', refId: srv1_5.id, nombre: 'Manicure', precio: 380 }], estado: 'PAGADA' })
  await crearFactura({ negocioId: neg1.id, clienteId: clis1[4].id, sucursalId: s1A.id, citaId: c1_5.id, createdBy: u1Cajero.id, items: [{ tipo: 'SERVICIO', refId: srv1_1.id, nombre: 'Corte Caballero', precio: 350 }], estado: 'PENDIENTE' })
  await crearFactura({ negocioId: neg1.id, clienteId: clis1[5].id, sucursalId: s1A.id, citaId: c1_6.id, createdBy: u1Cajero.id, sesionId: ses1.id, metodoPagoId: mp1Ef.id, items: [{ tipo: 'SERVICIO', refId: srv1_2.id, nombre: 'Corte Dama', precio: 550 },{ tipo: 'SERVICIO', refId: srv1_6.id, nombre: 'Tratamiento Capilar', precio: 800 }], estado: 'PARCIAL' })

  console.log('   ✅ 2 sucursales, 3 empleados, 6 clientes, 6 servicios, 5 facturas')

  // ══════════════════════════════════════════════════════════════════════════
  // EMPRESA 2: Clínica DentalCare (Salud) — Santiago
  // ══════════════════════════════════════════════════════════════════════════

  console.log('\n📍 Empresa 2: Clínica DentalCare')

  const neg2 = await upsertNegocio({ nombre: 'Clínica DentalCare', descripcion: 'Clínica dental integral en Santiago', RNC: '1-32-98765-4', telefono: '809-580-2200', email: 'citas@dentalcare.com.do', direccion: 'Av. Juan Pablo Duarte #120, Santiago', categoria: 'SALUD', conItbis: true })

  const [u2Admin, u2Cajero] = await Promise.all([
    upsertUsuario('admin@dentalcare.com', 'Dr. Roberto', 'Herrera', neg2.id, roles.admin),
    upsertUsuario('recepcion@dentalcare.com', 'Sofía', 'Pimentel', neg2.id, roles.cajero),
  ])

  const [s2A, s2B] = await Promise.all([
    upsertSucursal('DentalCare Centro', neg2.id, DIAS_LV, 8, 17),
    upsertSucursal('DentalCare Norte', neg2.id, DIAS_LS, 8, 16),
  ])

  const [srv2_1, srv2_2, srv2_3, srv2_4, srv2_5] = await Promise.all([
    upsertServicio('Limpieza Dental',     'Profilaxis y detartraje completo',       45, neg2.id, [{ sucursalId: s2A.id, precio: 1800 },{ sucursalId: s2B.id, precio: 1600 }]),
    upsertServicio('Extracción Simple',   'Extracción de pieza dental',             30, neg2.id, [{ sucursalId: s2A.id, precio: 1200 },{ sucursalId: s2B.id, precio: 1100 }]),
    upsertServicio('Empaste Resina',      'Restauración con resina fotopolimerizable',60,neg2.id, [{ sucursalId: s2A.id, precio: 2500 },{ sucursalId: s2B.id, precio: 2200 }]),
    upsertServicio('Blanqueamiento',      'Blanqueamiento dental profesional',      90, neg2.id, [{ sucursalId: s2A.id, precio: 6000 },{ sucursalId: s2B.id, precio: 5500 }]),
    upsertServicio('Consulta General',    'Evaluación y diagnóstico dental',        30, neg2.id, [{ sucursalId: s2A.id, precio: 800  },{ sucursalId: s2B.id, precio: 700  }]),
  ])

  const [e2_1, e2_2, e2_3] = await Promise.all([
    upsertEmpleado('Dr. Roberto', 'Herrera',  'roberto.herrera@dentalcare.com', '809-002-0001', s2A.id, neg2.id, 'FIJO', 85000, DIAS_LV, 8, 17),
    upsertEmpleado('Dra. Andrea', 'Reyes',    'andrea.reyes@dentalcare.com',    '809-002-0002', s2A.id, neg2.id, 'FIJO', 80000, DIAS_LV, 8, 17),
    upsertEmpleado('Dr. Marcos',  'Castillo', 'marcos.castillo@dentalcare.com', '809-002-0003', s2B.id, neg2.id, 'FIJO', 75000, DIAS_LS, 8, 16),
  ])

  for (const [empId, srvs] of [[e2_1.id,[srv2_1,srv2_2,srv2_3,srv2_4,srv2_5]],[e2_2.id,[srv2_1,srv2_3,srv2_4,srv2_5]],[e2_3.id,[srv2_1,srv2_2,srv2_5]]]) {
    for (const s of srvs as any[]) await asignarServicioEmpleado(empId as string, s.id)
  }

  const clis2 = await Promise.all([
    upsertCliente('Elena',    'Montero',  '829-202-0001', 'elena@hotmail.com',  neg2.id),
    upsertCliente('Víctor',   'Jiménez',  '849-202-0002', 'victor@gmail.com',   neg2.id),
    upsertCliente('Sandra',   'Polanco',  '809-202-0003', 'sandra@gmail.com',   neg2.id),
    upsertCliente('Felipe',   'Cruz',     '829-202-0004', null,                 neg2.id),
    upsertCliente('Daniela',  'Almonte',  '849-202-0005', 'dani@outlook.com',   neg2.id),
    upsertCliente('Alejandro','Serrano',  '809-202-0006', null,                 neg2.id),
    upsertCliente('Gabriela', 'Tejeda',   '829-202-0007', 'gaby@gmail.com',     neg2.id),
  ])

  const mp2Ef = await upsertMetodoPago('Efectivo',         'Pago en efectivo',    true,  neg2.id)
  const mp2TC = await upsertMetodoPago('Tarjeta Crédito',  'Visa / Mastercard',   false, neg2.id)
  const mp2SS = await upsertMetodoPago('ARS / Seguro',     'Seguro médico dental',false, neg2.id)

  const { sesion: ses2 } = await crearCajaConSesion('Caja DentalCare Centro', s2A.id, neg2.id, u2Cajero.id)

  const c2_1 = await crearCita(clis2[0].id, e2_1.id, s2A.id, new Date('2026-05-16T09:00:00Z'), 45, 'FINALIZADA', [srv2_1.id])
  const c2_2 = await crearCita(clis2[1].id, e2_2.id, s2A.id, new Date('2026-05-16T10:00:00Z'), 60, 'FINALIZADA', [srv2_3.id])
  const c2_3 = await crearCita(clis2[2].id, e2_1.id, s2A.id, new Date('2026-05-18T08:00:00Z'), 90, 'FINALIZADA', [srv2_4.id])
  const c2_4 = await crearCita(clis2[3].id, e2_3.id, s2B.id, new Date('2026-05-18T09:00:00Z'), 30, 'FINALIZADA', [srv2_5.id])
  await crearCita(clis2[4].id, e2_2.id, s2A.id, new Date('2026-05-18T11:00:00Z'), 30, 'CONFIRMADA', [srv2_5.id])
  await crearCita(clis2[5].id, e2_1.id, s2A.id, new Date('2026-05-19T09:00:00Z'), 45, 'PENDIENTE',  [srv2_1.id])
  await crearCita(clis2[6].id, e2_3.id, s2B.id, new Date('2026-05-20T10:00:00Z'), 60, 'PENDIENTE',  [srv2_3.id])

  await crearFactura({ negocioId: neg2.id, clienteId: clis2[0].id, sucursalId: s2A.id, citaId: c2_1.id, createdBy: u2Admin.id, sesionId: ses2.id, metodoPagoId: mp2SS.id, items: [{ tipo: 'SERVICIO', refId: srv2_1.id, nombre: 'Limpieza Dental', precio: 1800 }], estado: 'PAGADA' })
  await crearFactura({ negocioId: neg2.id, clienteId: clis2[1].id, sucursalId: s2A.id, citaId: c2_2.id, createdBy: u2Admin.id, sesionId: ses2.id, metodoPagoId: mp2TC.id, items: [{ tipo: 'SERVICIO', refId: srv2_3.id, nombre: 'Empaste Resina', precio: 2500 }], estado: 'PAGADA' })
  await crearFactura({ negocioId: neg2.id, clienteId: clis2[2].id, sucursalId: s2A.id, citaId: c2_3.id, createdBy: u2Cajero.id, sesionId: ses2.id, metodoPagoId: mp2Ef.id, items: [{ tipo: 'SERVICIO', refId: srv2_4.id, nombre: 'Blanqueamiento', precio: 6000 }], estado: 'PAGADA' })
  await crearFactura({ negocioId: neg2.id, clienteId: clis2[3].id, sucursalId: s2B.id, citaId: c2_4.id, createdBy: u2Cajero.id, metodoPagoId: mp2Ef.id, items: [{ tipo: 'SERVICIO', refId: srv2_5.id, nombre: 'Consulta General', precio: 800 }], estado: 'PENDIENTE' })

  console.log('   ✅ 2 sucursales, 3 doctores, 7 clientes, 5 servicios, 4 facturas')

  // ══════════════════════════════════════════════════════════════════════════
  // EMPRESA 3: AutoExpress (Automotriz) — Sto. Dgo. Este
  // ══════════════════════════════════════════════════════════════════════════

  console.log('\n📍 Empresa 3: AutoExpress')

  const neg3 = await upsertNegocio({ nombre: 'AutoExpress', descripcion: 'Taller de mecánica y mantenimiento vehicular', RNC: '1-33-54321-7', telefono: '809-788-3300', email: 'contacto@autoexpress.do', direccion: 'Autopista San Isidro Km 12, Sto. Dgo. Este', categoria: 'AUTOMOTRIZ' })

  const [u3Admin, u3Cajero] = await Promise.all([
    upsertUsuario('admin@autoexpress.do', 'Fernando', 'Peña', neg3.id, roles.admin),
    upsertUsuario('caja@autoexpress.do', 'Mariela', 'Soto', neg3.id, roles.cajero),
  ])

  const s3A = await upsertSucursal('AutoExpress Principal', neg3.id, DIAS_LS, 7, 18)
  const s3B = await upsertSucursal('AutoExpress Norte',     neg3.id, DIAS_LV, 8, 17)

  const [srv3_1, srv3_2, srv3_3, srv3_4, srv3_5, srv3_6] = await Promise.all([
    upsertServicio('Cambio de Aceite',       'Cambio de aceite + filtro',                30, neg3.id, [{ sucursalId: s3A.id, precio: 1200 },{ sucursalId: s3B.id, precio: 1100 }]),
    upsertServicio('Alineación y Balanceo',  'Alineación 4 ruedas + balanceo',           45, neg3.id, [{ sucursalId: s3A.id, precio: 1800 },{ sucursalId: s3B.id, precio: 1700 }]),
    upsertServicio('Revisión de Frenos',     'Inspección y ajuste del sistema de frenos',60, neg3.id, [{ sucursalId: s3A.id, precio: 2500 },{ sucursalId: s3B.id, precio: 2200 }]),
    upsertServicio('Diagnóstico Computarizado','Escaneo y diagnóstico electrónico',      45, neg3.id, [{ sucursalId: s3A.id, precio: 1500 },{ sucursalId: s3B.id, precio: 1400 }]),
    upsertServicio('Cambio de Batería',      'Instalación de batería nueva',             20, neg3.id, [{ sucursalId: s3A.id, precio: 3500 },{ sucursalId: s3B.id, precio: 3200 }]),
    upsertServicio('Lavado Completo',        'Lavado interior y exterior detallado',     60, neg3.id, [{ sucursalId: s3A.id, precio: 800  },{ sucursalId: s3B.id, precio: 750  }]),
  ])

  const [e3_1, e3_2, e3_3, e3_4] = await Promise.all([
    upsertEmpleado('José',   'Guerrero',  'jose@autoexpress.do',    '809-003-0001', s3A.id, neg3.id, 'FIJO', 25000, DIAS_LS, 7, 18),
    upsertEmpleado('Ramón',  'De la Cruz','ramon@autoexpress.do',   '809-003-0002', s3A.id, neg3.id, 'FIJO', 22000, DIAS_LS, 7, 18),
    upsertEmpleado('Carlos', 'Valdez',    'carlos@autoexpress.do',  '809-003-0003', s3B.id, neg3.id, 'FIJO', 20000, DIAS_LV, 8, 17),
    upsertEmpleado('Pedro',  'Familia',   'pfamilia@autoexpress.do','809-003-0004', s3A.id, neg3.id, 'POR_COMISION', null, DIAS_LS, 7, 18),
  ])

  for (const [empId, srvs] of [
    [e3_1.id,[srv3_1,srv3_2,srv3_3,srv3_4,srv3_5]],
    [e3_2.id,[srv3_1,srv3_2,srv3_3,srv3_6]],
    [e3_3.id,[srv3_4,srv3_5,srv3_1]],
    [e3_4.id,[srv3_6,srv3_1]],
  ]) { for (const s of srvs as any[]) await asignarServicioEmpleado(empId as string, s.id) }

  const clis3 = await Promise.all([
    upsertCliente('Andrés',   'Marte',     '829-203-0001', 'andres@gmail.com',  neg3.id),
    upsertCliente('Claudia',  'Féliz',     '849-203-0002', 'claudia@gmail.com', neg3.id),
    upsertCliente('Jorge',    'Espinal',   '809-203-0003', null,                neg3.id),
    upsertCliente('Beatriz',  'Ureña',     '829-203-0004', 'bea@outlook.com',   neg3.id),
    upsertCliente('Héctor',   'Vargas',    '849-203-0005', null,                neg3.id),
    upsertCliente('Natalia',  'Duarte',    '809-203-0006', 'nata@gmail.com',    neg3.id),
  ])

  const mp3Ef = await upsertMetodoPago('Efectivo',        'Efectivo RD$',          true,  neg3.id)
  const mp3TC = await upsertMetodoPago('Tarjeta',         'Visa / Mastercard',     false, neg3.id)
  const mp3Tr = await upsertMetodoPago('Transferencia',   'Pago móvil',            false, neg3.id)

  const { sesion: ses3 } = await crearCajaConSesion('Caja AutoExpress', s3A.id, neg3.id, u3Cajero.id)

  const c3_1 = await crearCita(clis3[0].id, e3_1.id, s3A.id, new Date('2026-05-17T07:30:00Z'), 30, 'FINALIZADA', [srv3_1.id])
  const c3_2 = await crearCita(clis3[1].id, e3_1.id, s3A.id, new Date('2026-05-17T09:00:00Z'), 45, 'FINALIZADA', [srv3_2.id])
  const c3_3 = await crearCita(clis3[2].id, e3_2.id, s3A.id, new Date('2026-05-18T07:30:00Z'), 60, 'FINALIZADA', [srv3_3.id])
  const c3_4 = await crearCita(clis3[3].id, e3_3.id, s3B.id, new Date('2026-05-18T08:00:00Z'), 45, 'FINALIZADA', [srv3_4.id])
  await crearCita(clis3[4].id, e3_1.id, s3A.id, new Date('2026-05-18T10:00:00Z'), 20, 'CONFIRMADA', [srv3_5.id])
  await crearCita(clis3[5].id, e3_4.id, s3A.id, new Date('2026-05-18T11:00:00Z'), 60, 'PENDIENTE',  [srv3_6.id])
  await crearCita(clis3[0].id, e3_2.id, s3A.id, new Date('2026-05-19T08:00:00Z'), 45, 'PENDIENTE',  [srv3_2.id])

  await crearFactura({ negocioId: neg3.id, clienteId: clis3[0].id, sucursalId: s3A.id, citaId: c3_1.id, createdBy: u3Admin.id, sesionId: ses3.id, metodoPagoId: mp3Ef.id, items: [{ tipo: 'SERVICIO', refId: srv3_1.id, nombre: 'Cambio de Aceite', precio: 1200 }], estado: 'PAGADA' })
  await crearFactura({ negocioId: neg3.id, clienteId: clis3[1].id, sucursalId: s3A.id, citaId: c3_2.id, createdBy: u3Admin.id, sesionId: ses3.id, metodoPagoId: mp3TC.id, items: [{ tipo: 'SERVICIO', refId: srv3_2.id, nombre: 'Alineación y Balanceo', precio: 1800 }], estado: 'PAGADA' })
  await crearFactura({ negocioId: neg3.id, clienteId: clis3[2].id, sucursalId: s3A.id, citaId: c3_3.id, createdBy: u3Cajero.id, sesionId: ses3.id, metodoPagoId: mp3Ef.id, items: [{ tipo: 'SERVICIO', refId: srv3_3.id, nombre: 'Revisión de Frenos', precio: 2500 }], estado: 'PAGADA' })
  await crearFactura({ negocioId: neg3.id, clienteId: clis3[3].id, sucursalId: s3B.id, citaId: c3_4.id, createdBy: u3Cajero.id, metodoPagoId: mp3Tr.id, items: [{ tipo: 'SERVICIO', refId: srv3_4.id, nombre: 'Diagnóstico Computarizado', precio: 1500 }], estado: 'PENDIENTE' })

  console.log('   ✅ 2 sucursales, 4 mecánicos, 6 clientes, 6 servicios, 4 facturas')

  // ══════════════════════════════════════════════════════════════════════════
  // EMPRESA 4: FitLife Gym (Fitness) — La Romana
  // ══════════════════════════════════════════════════════════════════════════

  console.log('\n📍 Empresa 4: FitLife Gym')

  const neg4 = await upsertNegocio({ nombre: 'FitLife Gym', descripcion: 'Gimnasio y centro de entrenamiento personal', RNC: '1-34-11223-5', telefono: '809-556-4400', email: 'info@fitlife.do', direccion: 'Calle Altagracia #8, La Romana', categoria: 'FITNESS' })

  const [u4Admin, u4Cajero] = await Promise.all([
    upsertUsuario('admin@fitlife.do', 'Lic. Marcos', 'Batista', neg4.id, roles.admin),
    upsertUsuario('caja@fitlife.do',  'Valeria', 'Santos', neg4.id, roles.cajero),
  ])

  const s4A = await upsertSucursal('FitLife La Romana', neg4.id, DIAS_TODO, 5, 22)

  const [srv4_1, srv4_2, srv4_3, srv4_4, srv4_5] = await Promise.all([
    upsertServicio('Clase de Spinning',     'Clase grupal de ciclismo indoor',         60, neg4.id, [{ sucursalId: s4A.id, precio: 500  }]),
    upsertServicio('Entrenamiento Personal','Sesión 1:1 con entrenador certificado',   60, neg4.id, [{ sucursalId: s4A.id, precio: 1500 }]),
    upsertServicio('Yoga y Meditación',     'Clase de yoga para todos los niveles',    75, neg4.id, [{ sucursalId: s4A.id, precio: 400  }]),
    upsertServicio('Zumba',                 'Clase de baile y cardio',                 60, neg4.id, [{ sucursalId: s4A.id, precio: 350  }]),
    upsertServicio('Evaluación Física',     'Evaluación completa + plan nutricional',  90, neg4.id, [{ sucursalId: s4A.id, precio: 2000 }]),
  ])

  const [e4_1, e4_2, e4_3] = await Promise.all([
    upsertEmpleado('Marcos',  'Batista',  'marcos@fitlife.do',  '809-004-0001', s4A.id, neg4.id, 'FIJO', 30000, DIAS_TODO, 5, 14),
    upsertEmpleado('Karina',  'Medina',   'karina@fitlife.do',  '809-004-0002', s4A.id, neg4.id, 'FIJO', 28000, DIAS_TODO, 14, 22),
    upsertEmpleado('Dylan',   'Peralta',  'dylan@fitlife.do',   '809-004-0003', s4A.id, neg4.id, 'POR_COMISION', null, DIAS_LS, 8, 20),
  ])

  for (const [empId, srvs] of [[e4_1.id,[srv4_1,srv4_2,srv4_5]],[e4_2.id,[srv4_3,srv4_4,srv4_1]],[e4_3.id,[srv4_2,srv4_5]]]) {
    for (const s of srvs as any[]) await asignarServicioEmpleado(empId as string, s.id)
  }

  const clis4 = await Promise.all([
    upsertCliente('Ingrid',  'Camilo',    '829-204-0001', 'ingrid@gmail.com', neg4.id),
    upsertCliente('Tomás',   'Ramos',     '849-204-0002', null,               neg4.id),
    upsertCliente('Silvia',  'De Peña',   '809-204-0003', 'silvia@gmail.com', neg4.id),
    upsertCliente('Néstor',  'Ogando',    '829-204-0004', null,               neg4.id),
    upsertCliente('Wendy',   'Ortega',    '849-204-0005', 'wendy@gmail.com',  neg4.id),
  ])

  const mp4Ef = await upsertMetodoPago('Efectivo',     'Pago en efectivo', true,  neg4.id)
  const mp4TC = await upsertMetodoPago('Tarjeta',      'Visa/MC',          false, neg4.id)

  const { sesion: ses4 } = await crearCajaConSesion('Caja FitLife', s4A.id, neg4.id, u4Cajero.id)

  const c4_1 = await crearCita(clis4[0].id, e4_1.id, s4A.id, new Date('2026-05-18T06:00:00Z'), 60, 'FINALIZADA', [srv4_1.id])
  const c4_2 = await crearCita(clis4[1].id, e4_3.id, s4A.id, new Date('2026-05-18T08:00:00Z'), 60, 'FINALIZADA', [srv4_2.id])
  const c4_3 = await crearCita(clis4[2].id, e4_2.id, s4A.id, new Date('2026-05-18T15:00:00Z'), 75, 'CONFIRMADA', [srv4_3.id])
  await crearCita(clis4[3].id, e4_1.id, s4A.id, new Date('2026-05-18T07:00:00Z'), 60, 'FINALIZADA', [srv4_4.id])
  await crearCita(clis4[4].id, e4_3.id, s4A.id, new Date('2026-05-19T09:00:00Z'), 90, 'PENDIENTE',  [srv4_5.id])

  await crearFactura({ negocioId: neg4.id, clienteId: clis4[0].id, sucursalId: s4A.id, citaId: c4_1.id, createdBy: u4Admin.id, sesionId: ses4.id, metodoPagoId: mp4Ef.id, items: [{ tipo: 'SERVICIO', refId: srv4_1.id, nombre: 'Spinning', precio: 500 }], estado: 'PAGADA' })
  await crearFactura({ negocioId: neg4.id, clienteId: clis4[1].id, sucursalId: s4A.id, citaId: c4_2.id, createdBy: u4Cajero.id, sesionId: ses4.id, metodoPagoId: mp4TC.id, items: [{ tipo: 'SERVICIO', refId: srv4_2.id, nombre: 'Entrenamiento Personal', precio: 1500 }], estado: 'PAGADA' })
  await crearFactura({ negocioId: neg4.id, clienteId: clis4[2].id, sucursalId: s4A.id, citaId: c4_3.id, createdBy: u4Cajero.id, metodoPagoId: mp4Ef.id, items: [{ tipo: 'SERVICIO', refId: srv4_3.id, nombre: 'Yoga', precio: 400 }], estado: 'PENDIENTE' })

  console.log('   ✅ 1 sucursal, 3 entrenadores, 5 clientes, 5 servicios, 3 facturas')

  // ══════════════════════════════════════════════════════════════════════════
  // RESUMEN FINAL
  // ══════════════════════════════════════════════════════════════════════════

  console.log('\n' + '═'.repeat(65))
  console.log('🎉  SEED COMPLETADO')
  console.log('═'.repeat(65))
  console.log('\n🔑  PASSWORD UNIVERSAL: 123456')
  console.log('\n🏢  EMPRESAS Y CREDENCIALES:')
  console.log('\n  1. Peluquería Bella (BELLEZA — Sto. Dgo.)')
  console.log('     admin@bella.com       → Admin')
  console.log('     cajero@bella.com      → Cajero')
  console.log('\n  2. Clínica DentalCare (SALUD — Santiago, con ITBIS)')
  console.log('     admin@dentalcare.com      → Admin')
  console.log('     recepcion@dentalcare.com  → Cajero/Recepción')
  console.log('\n  3. AutoExpress (AUTOMOTRIZ — Sto. Dgo. Este)')
  console.log('     admin@autoexpress.do  → Admin')
  console.log('     caja@autoexpress.do   → Cajero')
  console.log('\n  4. FitLife Gym (FITNESS — La Romana)')
  console.log('     admin@fitlife.do      → Admin')
  console.log('     caja@fitlife.do       → Cajero')
  console.log('\n📊  TOTAL DATOS:')
  console.log('     4 negocios, 8 sucursales, 13 empleados')
  console.log('     24 clientes, 22 servicios, 4 métodos de pago por negocio')
  console.log('     Citas: FINALIZADA, CONFIRMADA, PENDIENTE, CANCELADA')
  console.log('     Facturas: PAGADA, PARCIAL, PENDIENTE + movimientos de caja')
  console.log('     Cada negocio tiene su caja ABIERTA lista para probar')
  console.log('═'.repeat(65))
}

main()
  .catch(e => { console.error('\n❌ Error en seed:', e.message || e); process.exit(1) })
  .finally(() => prisma.$disconnect())
