import { NextResponse } from 'next/server'
import { AppError, ValidationError } from './errors'

export function handleValidationError(error: any): ValidationError | null {
  if (error?.name === 'ValidationError' && Array.isArray(error?.errors)) {
    return new ValidationError(error.errors)
  }
  return null
}

export function handleApiError(error: unknown) {
  const validationError = handleValidationError(error)
  if (validationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: validationError.code,
          message: validationError.errors.join(', ')
        }
      },
      { status: 400 }
    )
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    )
  }

  if ((error as any)?.code?.startsWith('P')) {
    const prismaError = error as { code: string; message: string; meta?: any }

    switch (prismaError.code) {
      case 'P2002':
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: `Ya existe un registro con valor único duplicado (${prismaError.meta?.target})`
            }
          },
          { status: 409 }
        )
      case 'P2025':
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'El registro no existe o fue eliminado' }
          },
          { status: 404 }
        )
      default:
        return NextResponse.json(
          {
            success: false,
            error: { code: `DB_ERROR_${prismaError.code}`, message: prismaError.message }
          },
          { status: 400 }
        )
    }
  }

  console.error('Error no manejado:', error)

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor'
      }
    },
    { status: 500 }
  )
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function createdResponse<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export function noContentResponse() {
  return new NextResponse(null, { status: 204 })
}
