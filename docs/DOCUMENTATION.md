# 📋 Documento de Requerimientos (PRD)

## 1. Objetivos del Sistema
Facilitar la reserva de servicios, automatizar la facturación y centralizar la administración de sucursales.

## 2. Requerimientos Funcionales

### A. Gestión de Usuarios y Seguridad
- **RBAC (Role Based Access Control):** Diferenciación clara entre Administrador, Empleado y Cliente.
- **Registro:** Flujo de autenticación seguro (Email/Password).

### B. Gestión de Operaciones
- **Negocios y Sucursales:** Capacidad de gestionar múltiples sucursales bajo una misma entidad.
- **Servicios:** Creación, edición y asociación de servicios a empleados específicos.
- **Citas:** - Verificación de disponibilidad horaria.
  - Estados: `PENDIENTE` -> `CONFIRMADA` -> `CANCELADA` -> `FINALIZADA`.

### C. Facturación y Pagos
- Generación de facturas ligadas a citas.
- Gestión de estados de pago (`PENDIENTE`, `PAGADA`, `CANCELADA`).
- Historial de movimientos de caja.

## 3. Requerimientos No Funcionales
- **Escalabilidad:** Arquitectura lista para migrar a una app móvil (Sails.js/API-first).
- **Consistencia:** Uso de transacciones de base de datos para pagos y citas.
- **Seguridad:** Protección de rutas mediante Middlewares en Next.js.  
