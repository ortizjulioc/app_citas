# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format with Prettier (src/**/*.{js,jsx,ts,tsx})
npm run build:icons  # Rebuild iconify icon bundles (run after adding icons)
```

**Database (Prisma):**
```bash
npx prisma migrate dev      # Create and apply a new migration
npx prisma migrate deploy   # Apply pending migrations (CI/prod)
npx prisma generate         # Regenerate client after schema changes (outputs to src/generated/prisma/)
npx prisma studio           # Visual DB browser
```

There is no test framework configured in this project.

## Environment

Requires a `.env` file:
```
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
JWT_SECRET="your-secret-key"
```

## Architecture

This is a **Next.js 16 full-stack app** (App Router) for managing appointments, clients, employees, billing, and cash operations for service businesses. TypeScript throughout.

### Routing & Layouts

- `/(dashboard)/` — protected pages rendered inside the main nav layout
- `/(blank-layout-pages)/` — unauthenticated pages (e.g., `/login`)
- `next.config.ts` redirects `/` → `/home`
- `src/components/Providers.tsx` wraps the app in all React contexts

### API Layer (`src/app/api/`)

Route handlers follow a consistent pattern:
1. Parse and validate request body with a **Yup schema** from `src/app/schemas/`
2. Call Prisma directly (no service layer abstraction)
3. Return responses via helpers from `src/utils/api-response.ts`
4. Throw custom errors from `src/utils/errors.ts` (`AppError`, `ValidationError`, etc.) — these are caught centrally

### Database

- PostgreSQL via **Prisma ORM** (`prisma/schema.prisma`, 20+ models)
- Prisma client uses the `@prisma/adapter-pg` pool adapter; the singleton is at `src/utils/lib/prisma.ts`
- Generated client lives in `src/generated/prisma/` (not `node_modules`) — configured in `prisma.config.ts`

### Authentication

- `POST /api/auth/login` issues a JWT (12h expiry) signed with `JWT_SECRET`
- JWT helpers are in `src/utils/lib/jwt.ts`
- RBAC is modeled as `Usuario → UsuarioRol → Rol → RolPermiso → Permiso` in the schema

### UI / Theming

- **MUI v6** for components; theme configuration and overrides live in `src/@core/theme/`
- **Tailwind CSS** is available alongside MUI; custom plugin is in `src/@core/tailwind/`
- Layout components (vertical/horizontal nav) are in `src/@layouts/`; menu components in `src/@menu/`
- Icons use **Iconify** — bundles are pre-built to CSS and live in `src/assets/iconify-icons/`

### Path Aliases (tsconfig.json)

| Alias | Maps to |
|-------|---------|
| `@/*` | `src/*` |
| `@core/*` | `src/@core/*` |
| `@layouts/*` | `src/@layouts/*` |
| `@menu/*` | `src/@menu/*` |
| `@assets/*` | `src/assets/*` |
| `@components/*` | `src/components/*` |
| `@configs/*` | `src/configs/*` |
| `@views/*` | `src/views/*` |
