export class AppError extends Error {
  statusCode: number
  code: string

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    Error.captureStackTrace(this, this.constructor)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Solicitud inválida') {
    super(message, 400, 'BAD_REQUEST')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto de datos') {
    super(message, 409, 'CONFLICT')
  }
}

export class ValidationError extends AppError {
  errors: string[]

  constructor(errors: string[], message = 'Error de validación') {
    super(message, 400, 'VALIDATION_ERROR')
    this.errors = errors
  }
}

export class PrismaError {
  static fromKnown(error: any): AppError {
    switch (error.code) {
      case 'P2002':
        return new ConflictError(
          `Ya existe un registro con valor único duplicado (${error.meta?.target})`
        )
      case 'P2025':
        return new NotFoundError('El registro solicitado no existe o ya fue eliminado')
      case 'P2003':
        return new BadRequestError('Violación de integridad referencial')
      case 'P2011':
        return new BadRequestError('Valor nulo en campo requerido')
      case 'P2000':
        return new BadRequestError('Valor demasiado largo para el campo')
      default:
        return new AppError(`Error de base de datos (${error.code})`, 400, `PRISMA_${error.code}`)
    }
  }

  static validation(message = 'Datos inválidos según el modelo de datos') {
    return new BadRequestError(message)
  }

  static unknown(message = 'Error desconocido de base de datos') {
    return new AppError(message, 500, 'PRISMA_UNKNOWN_ERROR')
  }
}
