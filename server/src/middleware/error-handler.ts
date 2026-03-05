import type { Request, Response, NextFunction } from 'express'

type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: ErrorCode
  ) {
    super(message)
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err)

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    })
    return
  }

  res.status(500).json({
    error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
  })
}
