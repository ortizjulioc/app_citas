# AGENTS.md - Development Guidelines for Agentic Coding

This file provides guidance for AI agents working in this codebase.

## Project Overview

This is a **Next.js 16 full-stack application** for managing appointments, clients, employees, billing, and cash operations for service businesses. It uses:
- **Framework**: Next.js 16 (App Router) with TypeScript
- **UI**: MUI v6 + Tailwind CSS + Iconify icons
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT-based authentication with RBAC
- **Validation**: Yup schemas

---

## Commands

### Development
```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
```

### Linting & Formatting
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format with Prettier (src/**/*.{js,jsx,ts,tsx})
```

### Database (Prisma)
```bash
npx prisma migrate dev      # Create and apply a new migration
npx prisma migrate deploy   # Apply pending migrations (CI/prod)
npx prisma generate         # Regenerate client after schema changes
npx prisma studio           # Visual DB browser
```

### Icons
```bash
npm run build:icons  # Rebuild iconify icon bundles (run after adding icons)
```

**Note**: There is no test framework configured in this project.

---

## Code Style Guidelines

### TypeScript

- **Always use strict mode** - no `any` unless absolutely necessary
- **Use explicit type annotations** for function parameters and return types
- **Prefer interfaces over types** for object shapes
- **Use `import type`** for type-only imports
- **Avoid `any`** - use `unknown` if type is truly unknown
- **No `// @ts-ignore`** comments - fix types properly

### Imports & Path Aliases

Use path aliases defined in `tsconfig.json`:
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

**Import order** (enforced by ESLint):
1. Built-in (node modules)
2. External (npm packages)
3. Internal (path aliases like `@/`)
4. Relative imports

Group imports with blank lines between groups. Example:
```typescript
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import prisma from '@/utils/lib/prisma'
import { AppError, NotFoundError } from '@/utils/errors'
import { successResponse } from '@/utils/api-response'
import { generateToken } from '@/utils/lib/jwt'

import { updateUserSchema } from '@/app/schemas/usuario.schema'
import { validateRequest } from '@/utils/lib/validation'
```

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`) or PascalCase for components (`UserList.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions/variables**: camelCase (`getUserById`, `userList`)
- **Constants**: UPPER_SNAKE_CASE or camelCase with prefix `k` for enum-like values
- **Interfaces**: PascalCase with `I` prefix optional (`User` or `IUser`)
- **Types**: PascalCase
- **Boolean variables**: Use `is`, `has`, `should` prefixes (`isActive`, `hasPermission`)

### Formatting (Prettier)

- **Print width**: 120 characters
- **Single quotes** for JS/TS (including JSX)
- **No semicolons**
- **2 spaces** for indentation
- **Trailing commas**: none

### API Routes Pattern

All API routes follow this structure:
1. Parse and validate request body with **Yup schema** from `src/app/schemas/`
2. Call Prisma directly (no service layer)
3. Return responses via helpers from `src/utils/api-response.ts`
4. Throw custom errors from `src/utils/errors.ts`

Example:
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = await yourSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const result = await prisma.entity.create({ data: validatedData })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Error Handling

Use custom error classes from `@/utils/errors`:
- `AppError` - base error (status code, code, message)
- `BadRequestError` - 400
- `UnauthorizedError` - 401
- `ForbiddenError` - 403
- `NotFoundError` - 404
- `ConflictError` - 409
- `ValidationError` - 400 with validation errors array

Handle Prisma errors with `PrismaError.fromKnown(error)` for common error codes (P2002, P2025, etc.).

### Database (Prisma)

- Generated client lives in `src/generated/prisma/` (not `node_modules`)
- Use `@prisma/adapter-pg` pool adapter via singleton at `src/utils/lib/prisma.ts`
- Always use `deleted: false` filter for soft-delete queries
- Include relations explicitly when needed

### UI Components

- Use MUI v6 components from `@mui/material`
- Follow existing patterns in `src/@core/components/`
- Use Tailwind for custom styling alongside MUI
- Use Iconify icons from bundled CSS in `src/assets/iconify-icons/`

### Component Structure

Follow this pattern for React components:
```typescript
'use client'

import { useState } from 'react'
import { Box, Typography } from '@mui/material'

interface Props {
  title: string
  onSubmit: () => void
}

export default function YourComponent({ title, onSubmit }: Props) {
  const [loading, setLoading] = useState(false)

  return (
    <Box>
      <Typography>{title}</Typography>
    </Box>
  )
}
```

- Use `'use client'` directive for client components
- Destructure props explicitly with type annotations
- Keep components focused and small

### State Management

- Use React `useState` for local state
- Avoid global state unless necessary
- Use context for shared state (see `src/components/Providers.tsx`)

### ESLint Rules

Key rules enforced:
- `@typescript-eslint/consistent-type-imports` - error
- `@typescript-eslint/no-unused-vars` - error
- `import/order` - groups and newline enforcement
- `padding-line-between-statements` - blank lines between exports, let/const
- `lines-around-comment` - comments require surrounding newlines

---

## Environment Variables

Create `.env` file:
```
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
JWT_SECRET="your-secret-key"
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── [resource]/    # Resource routes
│   └── schemas/           # Yup validation schemas
├── components/            # React components
├── configs/               # Configuration files
├── @core/                 # Core utilities, theme, hooks
├── @layouts/              # Layout components
├── @menu/                 # Menu components
├── @views/                # Page views
├── assets/                # Static assets (icons)
├── generated/prisma/      # Prisma client (generated)
├── types/                 # TypeScript types
└── utils/                 # Utility functions
    ├── lib/               # Library helpers (prisma, jwt)
    ├── errors.ts          # Custom error classes
    └── api-response.ts    # Response helpers
```

---

## Common Patterns

### Soft Deletes
Always filter `deleted: false` in Prisma queries:
```typescript
const users = await prisma.usuario.findMany({
  where: { deleted: false }
})
```

### Auth Middleware
Authentication uses JWT. Tokens expire after 12 hours. Include `Authorization: Bearer <token>` header.

### RBAC
Roles are managed via `Usuario → UsuarioRol → Rol → RolPermiso → Permiso` relationship in database.