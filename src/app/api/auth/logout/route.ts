import { successResponse } from '@/utils/api-response'

export async function GET() {
  const response = successResponse({ message: 'Sesión cerrada exitosamente' })
  response.cookies.delete('token')
  return response
}
