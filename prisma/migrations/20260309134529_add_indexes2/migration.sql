/*
  Warnings:

  - You are about to drop the column `fecha` on the `Cita` table. All the data in the column will be lost.
  - You are about to drop the column `horaFin` on the `Cita` table. All the data in the column will be lost.
  - You are about to drop the column `horaInicio` on the `Cita` table. All the data in the column will be lost.
  - The `estado` column on the `PeriodoNomina` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `abiertoPor` on the `SesionCaja` table. All the data in the column will be lost.
  - You are about to drop the column `cerradoPor` on the `SesionCaja` table. All the data in the column will be lost.
  - You are about to drop the column `horaApetura` on the `SesionCaja` table. All the data in the column will be lost.
  - You are about to drop the `MoviminetoProducto` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[empleadoId,inicio]` on the table `Cita` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[facturaId,servicioId]` on the table `DetalleFactura` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rolId,permisoId]` on the table `RolPermiso` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[citaId,servicioId]` on the table `ServicioCita` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[negocioId,nombre]` on the table `Sucursal` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[usuarioId,rolId]` on the table `UsuarioRol` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fin` to the `Cita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inicio` to the `Cita` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `tipo` on the `DetalleNomina` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `horaInicio` on the `HorarioEmpleado` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `horaFin` on the `HorarioEmpleado` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `horaApertura` to the `SesionCaja` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "TipoDetalleNomina" AS ENUM ('INGRESO', 'DEDUCCION', 'AJUSTE');

-- CreateEnum
CREATE TYPE "EstadoPeriodoNomina" AS ENUM ('ABIERTO', 'CERRADO', 'PAGADO');

-- DropForeignKey
ALTER TABLE "MoviminetoProducto" DROP CONSTRAINT "MoviminetoProducto_productoId_fkey";

-- DropIndex
DROP INDEX "Cita_fecha_idx";

-- DropIndex
DROP INDEX "Sucursal_nombre_key";

-- AlterTable
ALTER TABLE "Cita" DROP COLUMN "fecha",
DROP COLUMN "horaFin",
DROP COLUMN "horaInicio",
ADD COLUMN     "fin" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "inicio" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Cliente" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DetalleNomina" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoDetalleNomina" NOT NULL;

-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "creadoPor" TEXT;

-- AlterTable
ALTER TABLE "HorarioEmpleado" DROP COLUMN "horaInicio",
ADD COLUMN     "horaInicio" TIME NOT NULL,
DROP COLUMN "horaFin",
ADD COLUMN     "horaFin" TIME NOT NULL;

-- AlterTable
ALTER TABLE "Notificacion" ALTER COLUMN "leido" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "registradoPor" TEXT;

-- AlterTable
ALTER TABLE "PeriodoNomina" DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoPeriodoNomina";

-- AlterTable
ALTER TABLE "SesionCaja" DROP COLUMN "abiertoPor",
DROP COLUMN "cerradoPor",
DROP COLUMN "horaApetura",
ADD COLUMN     "abiertoPorId" TEXT,
ADD COLUMN     "cerradoPorId" TEXT,
ADD COLUMN     "horaApertura" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usuarioId" TEXT,
ALTER COLUMN "horaCierre" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "negocioId" TEXT;

-- DropTable
DROP TABLE "MoviminetoProducto";

-- DropEnum
DROP TYPE "tipoMovimiento";

-- CreateTable
CREATE TABLE "UsuarioNegocio" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UsuarioNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteNegocio" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "totalGastado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ultimaVisita" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisponibilidadEmpleado" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "horaInicio" TIME NOT NULL,
    "horaFin" TIME NOT NULL,

    CONSTRAINT "DisponibilidadEmpleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloqueoHorario" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloqueoHorario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialCita" (
    "id" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "estado" "EstadoCita" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT,

    CONSTRAINT "HistorialCita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoProducto" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "referencia" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimientoProducto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioNegocio_usuarioId_negocioId_key" ON "UsuarioNegocio"("usuarioId", "negocioId");

-- CreateIndex
CREATE INDEX "ClienteNegocio_negocioId_idx" ON "ClienteNegocio"("negocioId");

-- CreateIndex
CREATE INDEX "ClienteNegocio_clienteId_idx" ON "ClienteNegocio"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteNegocio_clienteId_negocioId_key" ON "ClienteNegocio"("clienteId", "negocioId");

-- CreateIndex
CREATE INDEX "BloqueoHorario_empleadoId_idx" ON "BloqueoHorario"("empleadoId");

-- CreateIndex
CREATE INDEX "MovimientoProducto_productoId_idx" ON "MovimientoProducto"("productoId");

-- CreateIndex
CREATE INDEX "Cita_sucursalId_idx" ON "Cita"("sucursalId");

-- CreateIndex
CREATE UNIQUE INDEX "Cita_empleadoId_inicio_key" ON "Cita"("empleadoId", "inicio");

-- CreateIndex
CREATE INDEX "Cliente_telefono_idx" ON "Cliente"("telefono");

-- CreateIndex
CREATE INDEX "ComisionEmpleado_empleadoId_idx" ON "ComisionEmpleado"("empleadoId");

-- CreateIndex
CREATE INDEX "ComisionEmpleado_servicioId_idx" ON "ComisionEmpleado"("servicioId");

-- CreateIndex
CREATE UNIQUE INDEX "DetalleFactura_facturaId_servicioId_key" ON "DetalleFactura"("facturaId", "servicioId");

-- CreateIndex
CREATE INDEX "DetalleNomina_nominaId_idx" ON "DetalleNomina"("nominaId");

-- CreateIndex
CREATE INDEX "Empleado_sucursalId_idx" ON "Empleado"("sucursalId");

-- CreateIndex
CREATE INDEX "Factura_clienteId_idx" ON "Factura"("clienteId");

-- CreateIndex
CREATE INDEX "Factura_citaId_idx" ON "Factura"("citaId");

-- CreateIndex
CREATE INDEX "Factura_sucursalId_idx" ON "Factura"("sucursalId");

-- CreateIndex
CREATE INDEX "Factura_numeroFactura_idx" ON "Factura"("numeroFactura");

-- CreateIndex
CREATE INDEX "HorarioEmpleado_empleadoId_idx" ON "HorarioEmpleado"("empleadoId");

-- CreateIndex
CREATE INDEX "MovimientoCaja_sesionCajaId_idx" ON "MovimientoCaja"("sesionCajaId");

-- CreateIndex
CREATE INDEX "Negocio_deleted_idx" ON "Negocio"("deleted");

-- CreateIndex
CREATE INDEX "Nomina_empleadoId_idx" ON "Nomina"("empleadoId");

-- CreateIndex
CREATE INDEX "Nomina_periodonominaId_idx" ON "Nomina"("periodonominaId");

-- CreateIndex
CREATE INDEX "Pago_facturaId_idx" ON "Pago"("facturaId");

-- CreateIndex
CREATE INDEX "Producto_sucursalId_idx" ON "Producto"("sucursalId");

-- CreateIndex
CREATE INDEX "RolPermiso_rolId_permisoId_idx" ON "RolPermiso"("rolId", "permisoId");

-- CreateIndex
CREATE UNIQUE INDEX "RolPermiso_rolId_permisoId_key" ON "RolPermiso"("rolId", "permisoId");

-- CreateIndex
CREATE UNIQUE INDEX "ServicioCita_citaId_servicioId_key" ON "ServicioCita"("citaId", "servicioId");

-- CreateIndex
CREATE INDEX "ServicioEmpleado_servicioId_idx" ON "ServicioEmpleado"("servicioId");

-- CreateIndex
CREATE INDEX "ServicioEmpleado_empleadoId_idx" ON "ServicioEmpleado"("empleadoId");

-- CreateIndex
CREATE UNIQUE INDEX "Sucursal_negocioId_nombre_key" ON "Sucursal"("negocioId", "nombre");

-- CreateIndex
CREATE INDEX "UsuarioRol_usuarioId_idx" ON "UsuarioRol"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioRol_usuarioId_rolId_key" ON "UsuarioRol"("usuarioId", "rolId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "Permiso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioNegocio" ADD CONSTRAINT "UsuarioNegocio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioNegocio" ADD CONSTRAINT "UsuarioNegocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteNegocio" ADD CONSTRAINT "ClienteNegocio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteNegocio" ADD CONSTRAINT "ClienteNegocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisponibilidadEmpleado" ADD CONSTRAINT "DisponibilidadEmpleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloqueoHorario" ADD CONSTRAINT "BloqueoHorario_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialCita" ADD CONSTRAINT "HistorialCita_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_registradoPor_fkey" FOREIGN KEY ("registradoPor") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionCaja" ADD CONSTRAINT "SesionCaja_abiertoPorId_fkey" FOREIGN KEY ("abiertoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionCaja" ADD CONSTRAINT "SesionCaja_cerradoPorId_fkey" FOREIGN KEY ("cerradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionCaja" ADD CONSTRAINT "SesionCaja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoProducto" ADD CONSTRAINT "MovimientoProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
