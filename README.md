# Vínculo — Sistema de Gestión de Citas y Negocios

Plataforma SaaS multi-negocio para gestionar citas, facturación, caja, empleados e inventario. Construida con Next.js 16, PostgreSQL y Prisma. Diseñada para negocios de servicios en República Dominicana.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | MUI v6 + Tailwind CSS |
| Base de datos | PostgreSQL |
| ORM | Prisma (adapter-pg) |
| Autenticación | JWT (jsonwebtoken, 12h de expiración) |
| Validación | Yup |
| Iconos | Iconify (tabler-icons) |

---

## Arquitectura

```
src/
├── app/
│   ├── (blank-layout-pages)/   # Páginas sin nav: login, register, landing
│   ├── (dashboard)/            # Páginas protegidas con nav lateral
│   │   ├── empresa/            # Panel del administrador del negocio
│   │   ├── cliente/            # Panel del cliente (agenda citas)
│   │   └── empleado/           # Panel del empleado
│   └── api/                    # Route handlers (Next.js API)
├── views/                      # Componentes de vista (lógica de UI)
├── components/                 # Componentes reutilizables
├── contexts/                   # AuthContext, SucursalContext
├── utils/                      # Helpers, errores, respuestas API
└── @core/theme/                # Configuración del tema MUI
prisma/
├── schema.prisma               # Schema de la base de datos
└── seed.ts                     # Datos de prueba (4 negocios completos)
```

### Middleware de autenticación

`src/proxy.ts` intercepta todas las rutas y:
- Si hay token válido → permite el acceso y redirige según rol
- Si no hay token en ruta protegida → redirige a `/login`
- Rutas públicas: `/landing`, `/login`, `/register`, `/api/public/*`

---

## Módulos implementados

### Autenticación y roles

- Registro e inicio de sesión con JWT (cookie + header Authorization)
- Roles: `admin`, `cajero`, `empleado`, `cliente`
- RBAC: `Usuario → UsuarioRol → Rol → RolPermiso → Permiso`
- Cada negocio tiene sus propios usuarios y roles

### Negocios y sucursales

- Un usuario puede administrar un negocio con múltiples sucursales
- Cada sucursal tiene horarios configurables (días y horas de atención)
- Servicios con precio distinto por sucursal (`ServicioSucursal`)
- Configuración de ITBIS por negocio (`facturarConItbis`, `tasaItbis`)

### Empleados

- Perfil con tipo de salario (fijo, por hora, por comisión)
- Horario semanal por empleado con hora de inicio y fin (almacenado en UTC)
- Bloqueos de horario para ausencias o vacaciones
- Asignación de servicios que puede realizar cada empleado (`ServicioEmpleado`)
- Comisiones por servicio configurables

### Agenda de citas

**Flujo del cliente:**
1. Selecciona negocio → sucursal → servicio → fecha
2. El sistema consulta disponibilidad en tiempo real por empleado
3. Los slots aparecen como `HH:MM - Nombre Empleado` (un slot por empleado-hora)
4. El cliente puede filtrar por empleado específico o elegir cualquiera disponible
5. Al confirmar, la cita queda registrada con el empleado exacto seleccionado

**Endpoint de disponibilidad** (`GET /api/public/sucursales/[id]/disponibilidad`):
- Filtra empleados que pueden hacer el servicio (`ServicioEmpleado`)
- Revisa horario del empleado ese día (`HorarioEmpleado`)
- Descarta slots bloqueados (`BloqueoHorario`)
- Descarta slots ocupados por otras citas activas
- Genera slots cada 30 minutos dentro del horario disponible
- Todos los tiempos se manejan en UTC para consistencia

**Estados de una cita:** `PENDIENTE → CONFIRMADA → FINALIZADA | CANCELADA`

**Auto-factura:** Al cambiar una cita a `FINALIZADA`, se genera automáticamente una `Factura` con los servicios y sus precios de `ServicioSucursal`. Si el negocio tiene ITBIS activo, se aplica la tasa configurada.

### Facturación

- Numeración secuencial por negocio: `FAC-{AÑO}-{NÚMERO}` (e.g. `FAC-2026-00001`)
- La secuencia se maneja con `SecuenciaFactura` y un `upsert` atómico
- Cada factura puede tener múltiples líneas de detalle (`DetalleFactura`)
  - Tipo: `SERVICIO` o `PRODUCTO`
  - Precio unitario, cantidad, descuento por línea, subtotal
- Descuento global a nivel de factura
- ITBIS opcional: `tasaItbis` snapshot al momento de crear, `itbisAplicado` en RD$
- Campo `montoPagado` se actualiza con cada pago registrado
- Estados: `PENDIENTE → PARCIAL → PAGADA | CANCELADA`
- Cancelar factura revierte automáticamente el stock de productos vendidos

**Endpoints:**
```
GET    /api/facturas                    Listar con filtros (estado, sucursal, cliente, fecha)
POST   /api/facturas                    Crear factura manual
POST   /api/facturas/desde-cita         Generar desde cita finalizada (con extras opcionales)
GET    /api/facturas/[id]               Detalle + saldo pendiente
PATCH  /api/facturas/[id]/cancelar      Cancelar (requiere sin pagos activos)
```

### Pagos

- Un pago registra: `facturaId`, `metodoPagoId`, `monto`, `sesionCajaId` (opcional), `referencia`
- Al registrar un pago:
  1. Se actualiza `montoPagado` en la factura
  2. Se recalcula el estado de la factura (`PARCIAL` o `PAGADA`)
  3. Si el método de pago tiene `esEfectivo = true` y hay sesión de caja abierta, crea un `MovimientoCaja` de tipo `INGRESO` automáticamente
  4. Al quedar `PAGADA`, actualiza `totalGastado` y `ultimaVisita` en `ClienteNegocio`
- Anular un pago revierte todo lo anterior y crea un movimiento de reverso en caja

**Endpoints:**
```
GET    /api/pagos                       Listar pagos del negocio
POST   /api/pagos                       Registrar pago
PATCH  /api/pagos/[id]/anular           Anular pago y revertir caja
```

### Métodos de pago

- Cada negocio define sus propios métodos (`@@unique([negocioId, nombre])`)
- Flag `esEfectivo`: si está activo, los pagos con este método generan movimiento de caja
- Ejemplos: Efectivo (esEfectivo: true), Tarjeta, Transferencia (esEfectivo: false)

```
GET    /api/metodos-pago                Listar métodos del negocio
POST   /api/metodos-pago                Crear método
PATCH  /api/metodos-pago/[id]           Editar
DELETE /api/metodos-pago/[id]           Soft delete (si no tiene pagos activos)
```

### Caja (Punto de Venta)

**Concepto:** Una `Caja` pertenece a una sucursal. Cada vez que el cajero abre su turno, se crea una `SesionCaja`. Todos los cobros del día quedan vinculados a esa sesión.

**Flujo de un día:**
1. Cajero abre la caja → ingresa fondo inicial (`montoApertura`)
2. A lo largo del día registra ventas → facturas se crean y pagan desde Caja
3. Los pagos en efectivo generan `MovimientoCaja` de tipo `INGRESO`
4. Se pueden registrar gastos y retiros manuales (`GASTO`, `RETIRO`)
5. Al cerrar: el cajero ingresa el efectivo contado físicamente (`montoRealContado`)
6. El sistema calcula `montoEsperado` = apertura + ingresos - gastos - retiros
7. `diferencia` = contado - esperado (positivo = sobrante, negativo = faltante)

**Panel de Caja (POS):**
- Vista de tarjetas por caja con estado `ABIERTA/CERRADA`
- Tab "Ventas del Día": facturas de la sesión activa con botón "Cobrar"
- Botón "Nueva Venta": busca cliente existente o crea cliente rápido (nombre + apellido)
- Tab "Historial": sesiones anteriores con su arqueo
- Tab "Métodos de Pago": gestión de métodos de cobro

**Endpoints:**
```
GET    /api/caja                              Listar cajas del negocio
POST   /api/caja                              Crear caja
GET    /api/caja/sesiones                     Listar sesiones con filtros
POST   /api/caja/sesiones/abrir               Abrir sesión (valida que no haya otra abierta)
GET    /api/caja/sesiones/[id]                Detalle + resumen financiero
POST   /api/caja/sesiones/[id]/cerrar         Cerrar con arqueo
GET    /api/caja/sesiones/[id]/movimientos    Listar movimientos
POST   /api/caja/sesiones/[id]/movimientos    Registrar gasto o retiro manual
```

### Productos e inventario

- Stock por producto y sucursal
- `MovimientoProducto` registra toda entrada/salida con referencia
- Al crear una factura con productos: descuenta stock automáticamente
- Al cancelar la factura: devuelve el stock
- Ajuste de stock manual desde la UI con tipo `ENTRADA | SALIDA | AJUSTE`

### Clientes

- Registro centralizado: un cliente puede tener citas en múltiples negocios
- `ClienteNegocio` acumula `totalGastado` y `ultimaVisita` por negocio
- Búsqueda por nombre o teléfono desde el POS (con debounce)
- Creación rápida ("cliente de mostrador") desde la caja: solo nombre + apellido

---

## Configuración y entorno

### Variables de entorno

```env
DATABASE_URL="postgresql://user:password@host:5432/app_citas?schema=public"
JWT_SECRET="tu-clave-secreta"
NEXT_PUBLIC_TOKEN_NAME="app_citas_token"
```

### Comandos

```bash
# Desarrollo
npm run dev               # Servidor con Turbopack
npm run build             # Build de producción
npm run lint              # Linting con ESLint
npm run format            # Formatear con Prettier

# Base de datos
npx prisma migrate dev --name "nombre"   # Crear y aplicar migración
npx prisma migrate deploy                # Aplicar migraciones en producción
npx prisma generate                      # Regenerar cliente Prisma
npx prisma studio                        # UI visual de la BD

# Datos de prueba
npm run seed              # Insertar 4 negocios con datos completos
```

---

## Datos de prueba (seed)

El seed crea **4 negocios** completamente funcionales:

| Negocio | Categoría | Email admin | Sucursales |
|---------|-----------|-------------|-----------|
| Peluquería Bella | BELLEZA | admin@bella.com | 2 |
| Clínica DentalCare | SALUD (con ITBIS) | admin@dentalcare.com | 2 |
| AutoExpress | AUTOMOTRIZ | admin@autoexpress.do | 2 |
| FitLife Gym | FITNESS | admin@fitlife.do | 1 |

**Password universal:** `123456`

Cada negocio incluye: empleados con horarios Lun-Sáb, servicios con precios por sucursal, clientes, métodos de pago, caja abierta con sesión activa, citas en distintos estados y facturas con diferentes estados de pago.

---

## Rutas de la aplicación

| Ruta | Rol | Descripción |
|------|-----|-------------|
| `/landing` | Público | Landing page del producto |
| `/login` | Público | Inicio de sesión |
| `/register` | Público | Registro de usuario/negocio |
| `/empresa/home` | Admin | Dashboard del negocio |
| `/empresa/citas` | Admin | Gestión de agenda |
| `/empresa/caja` | Admin/Cajero | POS, caja y facturación |
| `/empresa/facturas` | Admin | Historial de facturas |
| `/empresa/clientes` | Admin | Lista de clientes |
| `/empresa/empleados` | Admin | Gestión de empleados |
| `/empresa/servicios` | Admin | Servicios y precios |
| `/empresa/productos` | Admin | Inventario |
| `/empresa/sucursales` | Admin | Sucursales y horarios |
| `/cliente/empresas` | Cliente | Directorio de negocios |
| `/cliente/empresas/[id]` | Cliente | Agendar cita (stepper) |
| `/cliente/citas` | Cliente | Mis citas |

---

## Convenciones de API

Todas las respuestas siguen el formato:

```json
// Éxito
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

Los endpoints protegidos requieren `Authorization: Bearer <token>` en el header. El middleware también acepta el token desde la cookie `app_citas_token`.

Los campos de tiempo (`@db.Time` en Prisma) se almacenan y leen siempre en UTC para garantizar consistencia independientemente del timezone del servidor.

---

## Estado del proyecto

- [x] Autenticación JWT con roles y permisos
- [x] Gestión de negocios, sucursales y empleados
- [x] Horarios y disponibilidad en tiempo real
- [x] Agenda de citas con selección de especialista
- [x] Auto-factura al finalizar citas
- [x] Facturación manual con servicios y productos
- [x] ITBIS configurable por negocio
- [x] Módulo de pagos con múltiples métodos
- [x] Caja como POS (apertura, ventas, arqueo)
- [x] Inventario de productos con movimientos
- [x] Landing page pública
- [x] Seed con datos de prueba (4 negocios)
- [ ] Reportes y dashboard con métricas
- [ ] Notificaciones por email/WhatsApp
- [ ] Nómina y comisiones automáticas
- [ ] App móvil para clientes
