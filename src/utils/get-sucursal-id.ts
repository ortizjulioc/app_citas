import { JwtPayload } from './lib/jwt'

export function getSucursalId(body: Record<string, unknown>, user: JwtPayload | null): string {
  if (body.sucursalId && typeof body.sucursalId === 'string') {
    return body.sucursalId
  }

  throw new Error('No se pudo determinar la sucursal. Proporcione sucursalId.')
}
