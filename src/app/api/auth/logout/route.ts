import { NextResponse } from 'next/server'

export async function POST() {
  const tokenName = process.env.NEXT_PUBLIC_TOKEN_NAME || 'app_citas_token'

  const response = NextResponse.json({
    success: true,
    message: 'Sesión cerrada correctamente'
  })

  // Borramos la cookie desde el servidor
  response.cookies.set(tokenName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0) // Expira inmediatamente
  })

  return response
}
