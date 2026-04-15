import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')
  const { pathname } = request.nextUrl

  // Rutas que no requieren autenticación
  const publicPaths = ['/login', '/register', '/']
  const isPublicPath = publicPaths.some(p => pathname.startsWith(p))

  // Rutas de API que no requieren autenticación (endpoints de auth)
  const isApiAuthPath = pathname.startsWith('/api/auth')

  // Redirigir a login si no hay token y la ruta no es pública
  if (!token && !isPublicPath && !isApiAuthPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirigir al inicio si ya hay token y se intenta acceder a login o register
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Inject Authorization header if token exists
  const requestHeaders = new Headers(request.headers)
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token.value}`)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ]
}
