/*
  Warnings:

  - You are about to drop the `BloqueoHorario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Caja` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cita` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteNegocio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ComisionEmpleado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DetalleFactura` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DetalleNomina` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DisponibilidadEmpleado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Empleado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Factura` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HistorialCita` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HorarioEmpleado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MetodoPago` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MovimientoCaja` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MovimientoProducto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Negocio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Nomina` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notificacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pago` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PeriodoNomina` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Permiso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Producto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rol` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RolPermiso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Servicio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServicioCita` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServicioEmpleado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SesionCaja` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sucursal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UsuarioNegocio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UsuarioRol` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BloqueoHorario" DROP CONSTRAINT "BloqueoHorario_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "Caja" DROP CONSTRAINT "Caja_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "Cita" DROP CONSTRAINT "Cita_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "Cita" DROP CONSTRAINT "Cita_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "Cita" DROP CONSTRAINT "Cita_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "ClienteNegocio" DROP CONSTRAINT "ClienteNegocio_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "ClienteNegocio" DROP CONSTRAINT "ClienteNegocio_negocioId_fkey";

-- DropForeignKey
ALTER TABLE "ComisionEmpleado" DROP CONSTRAINT "ComisionEmpleado_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "ComisionEmpleado" DROP CONSTRAINT "ComisionEmpleado_servicioId_fkey";

-- DropForeignKey
ALTER TABLE "DetalleFactura" DROP CONSTRAINT "DetalleFactura_facturaId_fkey";

-- DropForeignKey
ALTER TABLE "DetalleFactura" DROP CONSTRAINT "DetalleFactura_servicioId_fkey";

-- DropForeignKey
ALTER TABLE "DetalleNomina" DROP CONSTRAINT "DetalleNomina_nominaId_fkey";

-- DropForeignKey
ALTER TABLE "DisponibilidadEmpleado" DROP CONSTRAINT "DisponibilidadEmpleado_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "Empleado" DROP CONSTRAINT "Empleado_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "Empleado" DROP CONSTRAINT "Empleado_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Factura" DROP CONSTRAINT "Factura_citaId_fkey";

-- DropForeignKey
ALTER TABLE "Factura" DROP CONSTRAINT "Factura_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "Factura" DROP CONSTRAINT "Factura_creadoPor_fkey";

-- DropForeignKey
ALTER TABLE "Factura" DROP CONSTRAINT "Factura_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "HistorialCita" DROP CONSTRAINT "HistorialCita_citaId_fkey";

-- DropForeignKey
ALTER TABLE "HorarioEmpleado" DROP CONSTRAINT "HorarioEmpleado_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "MovimientoCaja" DROP CONSTRAINT "MovimientoCaja_sesionCajaId_fkey";

-- DropForeignKey
ALTER TABLE "MovimientoProducto" DROP CONSTRAINT "MovimientoProducto_productoId_fkey";

-- DropForeignKey
ALTER TABLE "Nomina" DROP CONSTRAINT "Nomina_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "Nomina" DROP CONSTRAINT "Nomina_periodonominaId_fkey";

-- DropForeignKey
ALTER TABLE "Notificacion" DROP CONSTRAINT "Notificacion_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Pago" DROP CONSTRAINT "Pago_facturaId_fkey";

-- DropForeignKey
ALTER TABLE "Pago" DROP CONSTRAINT "Pago_metodoPagoId_fkey";

-- DropForeignKey
ALTER TABLE "Pago" DROP CONSTRAINT "Pago_registradoPor_fkey";

-- DropForeignKey
ALTER TABLE "Producto" DROP CONSTRAINT "Producto_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "RolPermiso" DROP CONSTRAINT "RolPermiso_permisoId_fkey";

-- DropForeignKey
ALTER TABLE "RolPermiso" DROP CONSTRAINT "RolPermiso_rolId_fkey";

-- DropForeignKey
ALTER TABLE "Servicio" DROP CONSTRAINT "Servicio_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "ServicioCita" DROP CONSTRAINT "ServicioCita_citaId_fkey";

-- DropForeignKey
ALTER TABLE "ServicioCita" DROP CONSTRAINT "ServicioCita_servicioId_fkey";

-- DropForeignKey
ALTER TABLE "ServicioEmpleado" DROP CONSTRAINT "ServicioEmpleado_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "ServicioEmpleado" DROP CONSTRAINT "ServicioEmpleado_servicioId_fkey";

-- DropForeignKey
ALTER TABLE "SesionCaja" DROP CONSTRAINT "SesionCaja_abiertoPorId_fkey";

-- DropForeignKey
ALTER TABLE "SesionCaja" DROP CONSTRAINT "SesionCaja_cajaId_fkey";

-- DropForeignKey
ALTER TABLE "SesionCaja" DROP CONSTRAINT "SesionCaja_cerradoPorId_fkey";

-- DropForeignKey
ALTER TABLE "SesionCaja" DROP CONSTRAINT "SesionCaja_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Sucursal" DROP CONSTRAINT "Sucursal_negocioId_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_negocioId_fkey";

-- DropForeignKey
ALTER TABLE "UsuarioNegocio" DROP CONSTRAINT "UsuarioNegocio_negocioId_fkey";

-- DropForeignKey
ALTER TABLE "UsuarioNegocio" DROP CONSTRAINT "UsuarioNegocio_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "UsuarioRol" DROP CONSTRAINT "UsuarioRol_rolId_fkey";

-- DropForeignKey
ALTER TABLE "UsuarioRol" DROP CONSTRAINT "UsuarioRol_usuarioId_fkey";

-- DropTable
DROP TABLE "BloqueoHorario";

-- DropTable
DROP TABLE "Caja";

-- DropTable
DROP TABLE "Cita";

-- DropTable
DROP TABLE "Cliente";

-- DropTable
DROP TABLE "ClienteNegocio";

-- DropTable
DROP TABLE "ComisionEmpleado";

-- DropTable
DROP TABLE "DetalleFactura";

-- DropTable
DROP TABLE "DetalleNomina";

-- DropTable
DROP TABLE "DisponibilidadEmpleado";

-- DropTable
DROP TABLE "Empleado";

-- DropTable
DROP TABLE "Factura";

-- DropTable
DROP TABLE "HistorialCita";

-- DropTable
DROP TABLE "HorarioEmpleado";

-- DropTable
DROP TABLE "MetodoPago";

-- DropTable
DROP TABLE "MovimientoCaja";

-- DropTable
DROP TABLE "MovimientoProducto";

-- DropTable
DROP TABLE "Negocio";

-- DropTable
DROP TABLE "Nomina";

-- DropTable
DROP TABLE "Notificacion";

-- DropTable
DROP TABLE "Pago";

-- DropTable
DROP TABLE "PeriodoNomina";

-- DropTable
DROP TABLE "Permiso";

-- DropTable
DROP TABLE "Producto";

-- DropTable
DROP TABLE "Rol";

-- DropTable
DROP TABLE "RolPermiso";

-- DropTable
DROP TABLE "Servicio";

-- DropTable
DROP TABLE "ServicioCita";

-- DropTable
DROP TABLE "ServicioEmpleado";

-- DropTable
DROP TABLE "SesionCaja";

-- DropTable
DROP TABLE "Sucursal";

-- DropTable
DROP TABLE "Usuario";

-- DropTable
DROP TABLE "UsuarioNegocio";

-- DropTable
DROP TABLE "UsuarioRol";

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "negocioId" TEXT,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_rol" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permiso" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permiso" (
    "id" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "permisoId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rol_permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negocio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "RNC" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_negocio" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "usuario_negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sucursal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "direccion" TEXT,
    "notas" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_negocio" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "totalGastado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ultimaVisita" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cliente_negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleado" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "sucursalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tipoSalario" "TipoSalario" NOT NULL,
    "salarioBase" DOUBLE PRECISION,
    "fechaContratacion" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidad_empleado" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "horaInicio" TIME NOT NULL,
    "horaFin" TIME NOT NULL,

    CONSTRAINT "disponibilidad_empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueo_horario" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloqueo_horario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horario_empleado" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "horaInicio" TIME NOT NULL,
    "horaFin" TIME NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horario_empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comision_empleado" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comision_empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicio" (
    "id" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION,
    "costo" DOUBLE PRECISION,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "duracionMinutos" INTEGER NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicio_empleado" (
    "id" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicio_empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cita" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCita" NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_cita" (
    "id" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "estado" "EstadoCita" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT,

    CONSTRAINT "historial_cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicio_cita" (
    "id" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicio_cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factura" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "citaId" TEXT,
    "sucursalId" TEXT NOT NULL,
    "creadoPor" TEXT,
    "numeroFactura" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "impuestos" DOUBLE PRECISION NOT NULL,
    "descuentos" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoFactura" NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_factura" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detalle_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "metodoPagoId" TEXT NOT NULL,
    "registradoPor" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,
    "referencia" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metodo_pago" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metodo_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caja" (
    "id" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" "EstadoCaja" NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesion_caja" (
    "id" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "abiertoPorId" TEXT,
    "cerradoPorId" TEXT,
    "cantidadApertura" DOUBLE PRECISION NOT NULL,
    "cantidadAlCerrar" DOUBLE PRECISION NOT NULL,
    "horaApertura" TIMESTAMP(3) NOT NULL,
    "horaCierre" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesion_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimiento_caja" (
    "id" TEXT NOT NULL,
    "sesionCajaId" TEXT NOT NULL,
    "tipo" "TipoMovimientoCaja" NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,
    "referenciaId" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimiento_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto" (
    "id" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "costo" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimiento_producto" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "referencia" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimiento_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodo_nomina" (
    "id" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoPeriodoNomina",

    CONSTRAINT "periodo_nomina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nomina" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "periodonominaId" TEXT NOT NULL,
    "salarioBase" DOUBLE PRECISION NOT NULL,
    "comision" DOUBLE PRECISION NOT NULL,
    "bonos" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nomina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_nomina" (
    "id" TEXT NOT NULL,
    "nominaId" TEXT NOT NULL,
    "tipo" "TipoDetalleNomina" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "detalle_nomina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE INDEX "usuario_rol_usuarioId_idx" ON "usuario_rol"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_rol_usuarioId_rolId_key" ON "usuario_rol"("usuarioId", "rolId");

-- CreateIndex
CREATE UNIQUE INDEX "permiso_nombre_key" ON "permiso"("nombre");

-- CreateIndex
CREATE INDEX "rol_permiso_rolId_permisoId_idx" ON "rol_permiso"("rolId", "permisoId");

-- CreateIndex
CREATE UNIQUE INDEX "rol_permiso_rolId_permisoId_key" ON "rol_permiso"("rolId", "permisoId");

-- CreateIndex
CREATE INDEX "negocio_deleted_idx" ON "negocio"("deleted");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_negocio_usuarioId_negocioId_key" ON "usuario_negocio"("usuarioId", "negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "sucursal_negocioId_nombre_key" ON "sucursal"("negocioId", "nombre");

-- CreateIndex
CREATE INDEX "cliente_telefono_idx" ON "cliente"("telefono");

-- CreateIndex
CREATE INDEX "cliente_negocio_negocioId_idx" ON "cliente_negocio"("negocioId");

-- CreateIndex
CREATE INDEX "cliente_negocio_clienteId_idx" ON "cliente_negocio"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_negocio_clienteId_negocioId_key" ON "cliente_negocio"("clienteId", "negocioId");

-- CreateIndex
CREATE INDEX "empleado_sucursalId_idx" ON "empleado"("sucursalId");

-- CreateIndex
CREATE INDEX "empleado_usuarioId_idx" ON "empleado"("usuarioId");

-- CreateIndex
CREATE INDEX "bloqueo_horario_empleadoId_idx" ON "bloqueo_horario"("empleadoId");

-- CreateIndex
CREATE INDEX "horario_empleado_empleadoId_idx" ON "horario_empleado"("empleadoId");

-- CreateIndex
CREATE INDEX "comision_empleado_empleadoId_idx" ON "comision_empleado"("empleadoId");

-- CreateIndex
CREATE INDEX "comision_empleado_servicioId_idx" ON "comision_empleado"("servicioId");

-- CreateIndex
CREATE INDEX "servicio_empleado_servicioId_idx" ON "servicio_empleado"("servicioId");

-- CreateIndex
CREATE INDEX "servicio_empleado_empleadoId_idx" ON "servicio_empleado"("empleadoId");

-- CreateIndex
CREATE INDEX "cita_clienteId_idx" ON "cita"("clienteId");

-- CreateIndex
CREATE INDEX "cita_empleadoId_idx" ON "cita"("empleadoId");

-- CreateIndex
CREATE INDEX "cita_sucursalId_idx" ON "cita"("sucursalId");

-- CreateIndex
CREATE UNIQUE INDEX "cita_empleadoId_inicio_key" ON "cita"("empleadoId", "inicio");

-- CreateIndex
CREATE UNIQUE INDEX "servicio_cita_citaId_servicioId_key" ON "servicio_cita"("citaId", "servicioId");

-- CreateIndex
CREATE INDEX "factura_clienteId_idx" ON "factura"("clienteId");

-- CreateIndex
CREATE INDEX "factura_citaId_idx" ON "factura"("citaId");

-- CreateIndex
CREATE INDEX "factura_sucursalId_idx" ON "factura"("sucursalId");

-- CreateIndex
CREATE INDEX "factura_numeroFactura_idx" ON "factura"("numeroFactura");

-- CreateIndex
CREATE UNIQUE INDEX "detalle_factura_facturaId_servicioId_key" ON "detalle_factura"("facturaId", "servicioId");

-- CreateIndex
CREATE INDEX "pago_facturaId_idx" ON "pago"("facturaId");

-- CreateIndex
CREATE UNIQUE INDEX "metodo_pago_nombre_key" ON "metodo_pago"("nombre");

-- CreateIndex
CREATE INDEX "movimiento_caja_sesionCajaId_idx" ON "movimiento_caja"("sesionCajaId");

-- CreateIndex
CREATE INDEX "producto_sucursalId_idx" ON "producto"("sucursalId");

-- CreateIndex
CREATE INDEX "movimiento_producto_productoId_idx" ON "movimiento_producto"("productoId");

-- CreateIndex
CREATE INDEX "nomina_empleadoId_idx" ON "nomina"("empleadoId");

-- CreateIndex
CREATE INDEX "nomina_periodonominaId_idx" ON "nomina"("periodonominaId");

-- CreateIndex
CREATE INDEX "detalle_nomina_nominaId_idx" ON "detalle_nomina"("nominaId");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_rol" ADD CONSTRAINT "usuario_rol_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_rol" ADD CONSTRAINT "usuario_rol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permiso" ADD CONSTRAINT "rol_permiso_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permiso" ADD CONSTRAINT "rol_permiso_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "permiso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_negocio" ADD CONSTRAINT "usuario_negocio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_negocio" ADD CONSTRAINT "usuario_negocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sucursal" ADD CONSTRAINT "sucursal_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_negocio" ADD CONSTRAINT "cliente_negocio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_negocio" ADD CONSTRAINT "cliente_negocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleado" ADD CONSTRAINT "empleado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleado" ADD CONSTRAINT "empleado_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidad_empleado" ADD CONSTRAINT "disponibilidad_empleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueo_horario" ADD CONSTRAINT "bloqueo_horario_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_empleado" ADD CONSTRAINT "horario_empleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comision_empleado" ADD CONSTRAINT "comision_empleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comision_empleado" ADD CONSTRAINT "comision_empleado_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio" ADD CONSTRAINT "servicio_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio_empleado" ADD CONSTRAINT "servicio_empleado_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio_empleado" ADD CONSTRAINT "servicio_empleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita" ADD CONSTRAINT "cita_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita" ADD CONSTRAINT "cita_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita" ADD CONSTRAINT "cita_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cita" ADD CONSTRAINT "historial_cita_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "cita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio_cita" ADD CONSTRAINT "servicio_cita_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "cita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio_cita" ADD CONSTRAINT "servicio_cita_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factura" ADD CONSTRAINT "factura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factura" ADD CONSTRAINT "factura_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factura" ADD CONSTRAINT "factura_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "cita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factura" ADD CONSTRAINT "factura_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_factura" ADD CONSTRAINT "detalle_factura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_factura" ADD CONSTRAINT "detalle_factura_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_metodoPagoId_fkey" FOREIGN KEY ("metodoPagoId") REFERENCES "metodo_pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_registradoPor_fkey" FOREIGN KEY ("registradoPor") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja" ADD CONSTRAINT "caja_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_caja" ADD CONSTRAINT "sesion_caja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_caja" ADD CONSTRAINT "sesion_caja_abiertoPorId_fkey" FOREIGN KEY ("abiertoPorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_caja" ADD CONSTRAINT "sesion_caja_cerradoPorId_fkey" FOREIGN KEY ("cerradoPorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_caja" ADD CONSTRAINT "sesion_caja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_caja" ADD CONSTRAINT "movimiento_caja_sesionCajaId_fkey" FOREIGN KEY ("sesionCajaId") REFERENCES "sesion_caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_producto" ADD CONSTRAINT "movimiento_producto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina" ADD CONSTRAINT "nomina_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomina" ADD CONSTRAINT "nomina_periodonominaId_fkey" FOREIGN KEY ("periodonominaId") REFERENCES "periodo_nomina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_nomina" ADD CONSTRAINT "detalle_nomina_nominaId_fkey" FOREIGN KEY ("nominaId") REFERENCES "nomina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
