import { BadRequestError } from './errors'
import { verifyToken, JwtPayload } from './lib/jwt'

export function getNegocioId(body: any, user: JwtPayload | null): string {
  const parsedNegocioId = body?.negocioId || user?.negocioId

  if (!parsedNegocioId) {
    throw new BadRequestError('No se pudo determinar el negocioId. Se requiere desde el body o la sesión del usuario.')
  }

  return parsedNegocioId
}

export function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || null

  if (!token) return null

  try {
    return verifyToken(token) as JwtPayload
  } catch {
    return null
  }
}
