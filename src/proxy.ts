import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const tokenName = process.env.NEXT_PUBLIC_TOKEN_NAME || 'app_citas_token'
  const token = request.cookies.get(tokenName)?.value
  const { pathname } = request.nextUrl

  // 1. Definición de rutas
  const authPaths = ['/login', '/register']
  const publicPaths = ['/landing', '/api/public'] // rutas accesibles sin sesión
  const isAuthPath = authPaths.some(p => pathname.startsWith(p))
  const isPublicPath = publicPaths.some(p => pathname.startsWith(p))
  const isApiAuthPath = pathname.startsWith('/api/auth')
  const isPublicAsset = pathname.startsWith('/_next') || pathname.includes('/images/')

  // 2. LÓGICA DE REDIRECCIÓN PARA USUARIOS LOGUEADOS
  if (token) {
    try {
      // Decodificamos el payload del JWT (Base64) sin verificar firma (solo para lectura de roles)
      const payloadBase64 = token.split('.')[1]
      const decodedPayload = JSON.parse(atob(payloadBase64))
      const roles: string[] = decodedPayload.roles || []

      // Si el usuario con sesión intenta ir al login o a la raíz, lo mandamos a su panel
      if (isAuthPath || pathname === '/') {
        if (roles.includes('admin')) {
          return NextResponse.redirect(new URL('/empresa', request.url))
        } else if (roles.includes('cliente')) {
          return NextResponse.redirect(new URL('/cliente', request.url))
        }
      }
    } catch (error) {
      // Si el token está mal formado, lo limpiamos y mandamos a login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete(tokenName)
      return response
    }
  }

  // 3. LÓGICA PARA USUARIOS NO AUTENTICADOS
  // Si no hay token y no es una ruta pública o de auth -> Al Login
  if (!token && !isAuthPath && !isPublicPath && !isApiAuthPath && !isPublicAsset && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 4. INYECCIÓN DE CABECERAS (Opcional, útil para tus APIs)
  const requestHeaders = new Headers(request.headers)
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - favicon.ico (favicon file)
     */
    '/((?!favicon.ico).*)'
  ]
}
