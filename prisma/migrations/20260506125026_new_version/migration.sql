/*
  Warnings:

  - The values [PENDIENTE,CANCELADA] on the enum `EstadoFactura` will be removed. If these variants are still used in the database, this will fail.
  - The values [GASTO] on the enum `TipoMovimientoCaja` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdAt` on the `usuario_negocio` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `usuario_negocio` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `usuario_negocio` table. All the data in the column will be lost.
  - You are about to drop the `bloqueo_horario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `caja` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cita` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cliente_negocio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `comision_empleado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `detalle_factura` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `detalle_nomina` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `disponibilidad_empleado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `empleado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `factura` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `historial_cita` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `horario_empleado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metodo_pago` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `movimiento_caja` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `movimiento_producto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `negocio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `nomina` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notificacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pago` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `periodo_nomina` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permiso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `producto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rol` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rol_permiso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `servicio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `servicio_cita` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `servicio_empleado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sesion_caja` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sucursal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuario_rol` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoItemFactura" AS ENUM ('SERVICIO', 'PRODUCTO');

-- CreateEnum
CREATE TYPE "EstadoSesionCaja" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoMovimientoInv" AS ENUM ('COMPRA', 'VENTA', 'AJUSTE');

-- AlterEnum
BEGIN;
CREATE TYPE "EstadoFactura_new" AS ENUM ('BORRADOR', 'PAGADA', 'ANULADA');
ALTER TABLE "Factura" ALTER COLUMN "estado" TYPE "EstadoFactura_new" USING ("estado"::text::"EstadoFactura_new");
ALTER TYPE "EstadoFactura" RENAME TO "EstadoFactura_old";
ALTER TYPE "EstadoFactura_new" RENAME TO "EstadoFactura";
DROP TYPE "public"."EstadoFactura_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TipoMovimientoCaja_new" AS ENUM ('INGRESO', 'EGRESO');
ALTER TABLE "MovimientoCaja" ALTER COLUMN "tipo" TYPE "TipoMovimientoCaja_new" USING ("tipo"::text::"TipoMovimientoCaja_new");
ALTER TYPE "TipoMovimientoCaja" RENAME TO "TipoMovimientoCaja_old";
ALTER TYPE "TipoMovimientoCaja_new" RENAME TO "TipoMovimientoCaja";
DROP TYPE "public"."TipoMovimientoCaja_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "bloqueo_horario" DROP CONSTRAINT "bloqueo_horario_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "caja" DROP CONSTRAINT "caja_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "cita" DROP CONSTRAINT "cita_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "cita" DROP CONSTRAINT "cita_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "cita" DROP CONSTRAINT "cita_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "cliente_negocio" DROP CONSTRAINT "cliente_negocio_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "cliente_negocio" DROP CONSTRAINT "cliente_negocio_negocioId_fkey";

-- DropForeignKey
ALTER TABLE "comision_empleado" DROP CONSTRAINT "comision_empleado_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "comision_empleado" DROP CONSTRAINT "comision_empleado_servicioId_fkey";

-- DropForeignKey
ALTER TABLE "detalle_factura" DROP CONSTRAINT "detalle_factura_facturaId_fkey";

-- DropForeignKey
ALTER TABLE "detalle_factura" DROP CONSTRAINT "detalle_factura_servicioId_fkey";

-- DropForeignKey
ALTER TABLE "detalle_nomina" DROP CONSTRAINT "detalle_nomina_nominaId_fkey";

-- DropForeignKey
ALTER TABLE "disponibilidad_empleado" DROP CONSTRAINT "disponibilidad_empleado_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "empleado" DROP CONSTRAINT "empleado_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "empleado" DROP CONSTRAINT "empleado_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "factura" DROP CONSTRAINT "factura_citaId_fkey";

-- DropForeignKey
ALTER TABLE "factura" DROP CONSTRAINT "factura_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "factura" DROP CONSTRAINT "factura_creadoPor_fkey";

-- DropForeignKey
ALTER TABLE "factura" DROP CONSTRAINT "factura_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "historial_cita" DROP CONSTRAINT "historial_cita_citaId_fkey";

-- DropForeignKey
ALTER TABLE "horario_empleado" DROP CONSTRAINT "horario_empleado_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "movimiento_caja" DROP CONSTRAINT "movimiento_caja_sesionCajaId_fkey";

-- DropForeignKey
ALTER TABLE "movimiento_producto" DROP CONSTRAINT "movimiento_producto_productoId_fkey";

-- DropForeignKey
ALTER TABLE "nomina" DROP CONSTRAINT "nomina_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "nomina" DROP CONSTRAINT "nomina_periodonominaId_fkey";

-- DropForeignKey
ALTER TABLE "notificacion" DROP CONSTRAINT "notificacion_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "pago" DROP CONSTRAINT "pago_facturaId_fkey";

-- DropForeignKey
ALTER TABLE "pago" DROP CONSTRAINT "pago_metodoPagoId_fkey";

-- DropForeignKey
ALTER TABLE "pago" DROP CONSTRAINT "pago_registradoPor_fkey";

-- DropForeignKey
ALTER TABLE "producto" DROP CONSTRAINT "producto_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "rol_permiso" DROP CONSTRAINT "rol_permiso_permisoId_fkey";

-- DropForeignKey
ALTER TABLE "rol_permiso" DROP CONSTRAINT "rol_permiso_rolId_fkey";

-- DropForeignKey
ALTER TABLE "servicio" DROP CONSTRAINT "servicio_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "servicio_cita" DROP CONSTRAINT "servicio_cita_citaId_fkey";

-- DropForeignKey
ALTER TABLE "servicio_cita" DROP CONSTRAINT "servicio_cita_servicioId_fkey";

-- DropForeignKey
ALTER TABLE "servicio_empleado" DROP CONSTRAINT "servicio_empleado_empleadoId_fkey";

-- DropForeignKey
ALTER TABLE "servicio_empleado" DROP CONSTRAINT "servicio_empleado_servicioId_fkey";

-- DropForeignKey
ALTER TABLE "sesion_caja" DROP CONSTRAINT "sesion_caja_abiertoPorId_fkey";

-- DropForeignKey
ALTER TABLE "sesion_caja" DROP CONSTRAINT "sesion_caja_cajaId_fkey";

-- DropForeignKey
ALTER TABLE "sesion_caja" DROP CONSTRAINT "sesion_caja_cerradoPorId_fkey";

-- DropForeignKey
ALTER TABLE "sesion_caja" DROP CONSTRAINT "sesion_caja_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "sucursal" DROP CONSTRAINT "sucursal_negocioId_fkey";

-- DropForeignKey
ALTER TABLE "usuario" DROP CONSTRAINT "usuario_negocioId_fkey";

-- DropForeignKey
ALTER TABLE "usuario_negocio" DROP CONSTRAINT "usuario_negocio_negocioId_fkey";

-- DropForeignKey
ALTER TABLE "usuario_negocio" DROP CONSTRAINT "usuario_negocio_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "usuario_rol" DROP CONSTRAINT "usuario_rol_rolId_fkey";

-- DropForeignKey
ALTER TABLE "usuario_rol" DROP CONSTRAINT "usuario_rol_usuarioId_fkey";

-- AlterTable
ALTER TABLE "usuario_negocio" DROP COLUMN "createdAt",
DROP COLUMN "deleted",
DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "bloqueo_horario";

-- DropTable
DROP TABLE "caja";

-- DropTable
DROP TABLE "cita";

-- DropTable
DROP TABLE "cliente";

-- DropTable
DROP TABLE "cliente_negocio";

-- DropTable
DROP TABLE "comision_empleado";

-- DropTable
DROP TABLE "detalle_factura";

-- DropTable
DROP TABLE "detalle_nomina";

-- DropTable
DROP TABLE "disponibilidad_empleado";

-- DropTable
DROP TABLE "empleado";

-- DropTable
DROP TABLE "factura";

-- DropTable
DROP TABLE "historial_cita";

-- DropTable
DROP TABLE "horario_empleado";

-- DropTable
DROP TABLE "metodo_pago";

-- DropTable
DROP TABLE "movimiento_caja";

-- DropTable
DROP TABLE "movimiento_producto";

-- DropTable
DROP TABLE "negocio";

-- DropTable
DROP TABLE "nomina";

-- DropTable
DROP TABLE "notificacion";

-- DropTable
DROP TABLE "pago";

-- DropTable
DROP TABLE "periodo_nomina";

-- DropTable
DROP TABLE "permiso";

-- DropTable
DROP TABLE "producto";

-- DropTable
DROP TABLE "rol";

-- DropTable
DROP TABLE "rol_permiso";

-- DropTable
DROP TABLE "servicio";

-- DropTable
DROP TABLE "servicio_cita";

-- DropTable
DROP TABLE "servicio_empleado";

-- DropTable
DROP TABLE "sesion_caja";

-- DropTable
DROP TABLE "sucursal";

-- DropTable
DROP TABLE "usuario";

-- DropTable
DROP TABLE "usuario_rol";

-- DropEnum
DROP TYPE "DiaSemana";

-- DropEnum
DROP TYPE "EstadoCaja";

-- DropEnum
DROP TYPE "EstadoCita";

-- DropEnum
DROP TYPE "EstadoPeriodoNomina";

-- DropEnum
DROP TYPE "TipoDetalleNomina";

-- DropEnum
DROP TYPE "TipoMovimiento";

-- DropEnum
DROP TYPE "TipoSalario";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permiso" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolPermiso" (
    "rolId" TEXT NOT NULL,
    "permisoId" TEXT NOT NULL,

    CONSTRAINT "RolPermiso_pkey" PRIMARY KEY ("rolId","permisoId")
);

-- CreateTable
CREATE TABLE "UsuarioNegocioRol" (
    "id" TEXT NOT NULL,
    "usuarioNegocioId" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,

    CONSTRAINT "UsuarioNegocioRol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Negocio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "totalGastado" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoProducto" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "tipo" "TipoMovimientoInv" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "balanceResultante" INTEGER NOT NULL,
    "referenciaId" TEXT,
    "detalleFacturaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoFactura" NOT NULL,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleFactura" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "tipoItem" "TipoItemFactura" NOT NULL,
    "referenciaId" TEXT,
    "nombreItem" TEXT NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DetalleFactura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetodoPago" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "MetodoPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "metodoPagoId" TEXT NOT NULL,
    "registradoPorId" TEXT NOT NULL,
    "sesionCajaId" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caja" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,

    CONSTRAINT "Caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SesionCaja" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "montoApertura" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoSesionCaja" NOT NULL,

    CONSTRAINT "SesionCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCaja" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "sesionCajaId" TEXT NOT NULL,
    "pagoId" TEXT,
    "tipo" "TipoMovimientoCaja" NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MovimientoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_negocioId_nombre_key" ON "Rol"("negocioId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_codigo_key" ON "Permiso"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioNegocioRol_usuarioNegocioId_rolId_key" ON "UsuarioNegocioRol"("usuarioNegocioId", "rolId");

-- CreateIndex
CREATE UNIQUE INDEX "Sucursal_negocioId_nombre_key" ON "Sucursal"("negocioId", "nombre");

-- CreateIndex
CREATE INDEX "Cliente_negocioId_idx" ON "Cliente"("negocioId");

-- CreateIndex
CREATE INDEX "Producto_negocioId_idx" ON "Producto"("negocioId");

-- CreateIndex
CREATE INDEX "MovimientoProducto_productoId_createdAt_idx" ON "MovimientoProducto"("productoId", "createdAt");

-- CreateIndex
CREATE INDEX "Factura_negocioId_idx" ON "Factura"("negocioId");

-- CreateIndex
CREATE UNIQUE INDEX "MetodoPago_negocioId_nombre_key" ON "MetodoPago"("negocioId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "MovimientoCaja_pagoId_key" ON "MovimientoCaja"("pagoId");

-- AddForeignKey
ALTER TABLE "usuario_negocio" ADD CONSTRAINT "usuario_negocio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_negocio" ADD CONSTRAINT "usuario_negocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rol" ADD CONSTRAINT "Rol_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "Permiso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioNegocioRol" ADD CONSTRAINT "UsuarioNegocioRol_usuarioNegocioId_fkey" FOREIGN KEY ("usuarioNegocioId") REFERENCES "usuario_negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioNegocioRol" ADD CONSTRAINT "UsuarioNegocioRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sucursal" ADD CONSTRAINT "Sucursal_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoProducto" ADD CONSTRAINT "MovimientoProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleFactura" ADD CONSTRAINT "DetalleFactura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetodoPago" ADD CONSTRAINT "MetodoPago_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_metodoPagoId_fkey" FOREIGN KEY ("metodoPagoId") REFERENCES "MetodoPago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_sesionCajaId_fkey" FOREIGN KEY ("sesionCajaId") REFERENCES "SesionCaja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionCaja" ADD CONSTRAINT "SesionCaja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_sesionCajaId_fkey" FOREIGN KEY ("sesionCajaId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
