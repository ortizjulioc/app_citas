# AGENTS.md - Development Guidelines for Agentic Coding

## Project Overview

**Next.js 16 full-stack app** for managing appointments, clients, employees, billing, and cash for service businesses.
- **Framework**: Next.js 16 (App Router) + TypeScript
- **UI**: MUI v6 + Tailwind CSS + Iconify (via bundled CSS)
- **Database**: PostgreSQL + Prisma ORM (custom client at `src/generated/prisma/`)
- **Auth**: JWT with RBAC (no middleware, page-level client-side protection)
- **Validation**: Yup schemas in `src/app/schemas/`

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run format       # Prettier: src/**/*.{js,jsx,ts,tsx}
npm run db:seed      # Seed roles via tsx prisma/seed.ts
```

### Database (Prisma 7.x with @prisma/adapter-pg)

```bash
npx prisma db push   # Sync schema to DB without migration (preferred while in dev)
npx prisma generate  # Regenerate client at src/generated/prisma
npx prisma studio    # Visual DB browser
```

**Important**: Do NOT use `prisma migrate` unless explicitly requested. This project uses `db push` because the DB already has data and schema drift exists.

### Linting

```bash
npm run format       # Format with Prettier
```

**ESLint v10 is installed but `.eslintrc.js` format is incompatible with ESLint v10**. Linting via `npm run lint` will fail. Manually run `npx tsc --noEmit` for type-checking instead.

## Architecture & Conventions

### Route Groups

```
src/app/
├── (dashboard)/         # Authenticated pages (sidebar, navbar)
│   ├── page.tsx         # / → admin-only dashboard home
│   ├── home/            # /home → redirects by role
│   ├── home/empresas/   # /home/empresas → client business listing
│   ├── home/empresas/[id]/  # /home/empresas/[id]/cita → booking flow
│   ├── cliente/         # client pages: /cliente, /cliente/citas, /cliente/perfil
│   ├── empresa/         # admin pages: /empresa, /empresa/sucursales, empleados, servicios, citas
│   └── about/           # /about → public
└── (blank-layout-pages)/
    ├── login/page.tsx   # /login
    └── register/page.tsx # /register
```

### Authentication & Authorization

- **JWT payload** includes `{ userId, email, nombre, apellido, negocioId, roles[] }`
- **Token stored** in both `localStorage` (key: `auth_data`) and HttpOnly cookie (`app_citas_token`)
- **Auth Context**: `src/contexts/AuthContext.tsx` provides `login()`, `logout()`, `hasRole(role)`, `isAuthenticated`, `isLoading`
- **Page protection pattern** (required for all dashboard pages):
```typescript
const { isAuthenticated, hasRole, isLoading } = useAuth()
useEffect(() => {
  if (!isLoading && (!isAuthenticated || !hasRole('admin'))) {
    router.push('/login')
  }
}, [isAuthenticated, hasRole, router, isLoading])
if (isLoading || !isAuthenticated || !hasRole('admin')) return <CircularProgress />
```

### RBAC Roles

- `admin` → full business management (sucursales, empleados, servicios, citas, etc.)
- `cliente` → can view businesses, book appointments, view own data
- `empleado` → defined later

### API Route Pattern

All API routes follow this structure (see `src/app/api/`):
1. Parse and validate body with **Yup schema**
2. Call Prisma directly (no service layer)
3. Return responses via `successResponse`, `createdResponse` from `src/utils/api-response.ts`
4. Wrap in try/catch with `handleApiError(error)`

API routes that need auth extract JWT from `Authorization: Bearer <token>` header inline (no centralized middleware).

### Client-to-Business Relationship

- `ClienteNegocio` table handles N:N relationship between Client and Business
- When a client books an appointment, `ClienteNegocio` record is auto-created if not existing
- `negocioId` field on `Cliente` model was removed in favor of `ClienteNegocio`

### Key Files

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Auth state, login/logout, role checking |
| `src/views/Login.tsx` | Login page with role-based redirect |
| `src/components/layout/vertical/VerticalMenu.tsx` | Menu rendered by role |
| `src/app/api/auth/register/route.ts` | Registration with auto-role assignment |
| `src/app/api/cliente-negocios/route.ts` | N:N client-business relationship CRUD |
| `prisma/seed.ts` | Seeds roles: admin, cliente, empleado |
| `src/utils/lib/prisma.ts` | Prisma singleton with pg adapter |
| `src/proxy.ts` | Unused (not registered as Next.js middleware) |

### Soft Deletes

All models have `deleted: Boolean @default(false)`. Always filter `where: { deleted: false }` in queries.

### UI Patterns

- Components use `'use client'` directive
- MUI v6 components + Tailwind utility classes (prefixed `bs-`, `is-`, `pli-`, `plb-` for logical properties)
- Iconify icons via `<i className='tabler-icon-name' />` (bundled in `src/assets/iconify-icons/`)
- No test framework

### Import Aliases

| Alias | Path |
|-------|------|
| `@/*` | `src/*` |
| `@core/*` | `src/@core/*` |
| `@components/*` | `src/components/*` |
| `@configs/*` | `src/configs/*` |
| `@views/*` | `src/views/*` |
| `@layouts/*` | `src/@layouts/*` |
| `@menu/*` | `src/@menu/*` |

### Environment Variables (`.env`)

```
DATABASE_URL="postgresql://user:pass@host:port/db?schema=public"
JWT_SECRET="your-secret"
NEXT_PUBLIC_TOKEN_NAME="app_citas_token"
```
