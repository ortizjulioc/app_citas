import { JwtPayload } from './lib/jwt'

export function getNegocioId(body: Record<string, unknown>, user: JwtPayload | null): string {
  if (body.negocioId && typeof body.negocioId === 'string') {
    return body.negocioId
  }

  if (user?.negocioId) {
    return user.negocioId
  }

  throw new Error('No se pudo determinar el negocio. Proporcione negocioId o inicie sesión en un negocio.')
}
