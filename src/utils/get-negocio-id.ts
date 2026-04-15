import { verifyToken, JwtPayload } from './lib/jwt'

export function getNegocioId(request: Request, _body?: unknown): string | null {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || null

  if (!token) return null

  try {
    const decoded = verifyToken(token) as JwtPayload
    return decoded?.negocioId || null
  } catch {
    return null
  }
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
