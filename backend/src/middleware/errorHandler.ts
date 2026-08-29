import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

interface ErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
  stack?: string;
}

/**
 * Centralized Express error handling middleware.
 * Must be registered LAST — after all routes.
 */
export function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof ApiError || (err && (err as any).isOperational !== undefined && typeof (err as any).statusCode === 'number')) {
    statusCode = (err as any).statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    // Mongoose bad ObjectId
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (Number((err as any).code) === 11000) {
    // MongoDB duplicate key
    statusCode = 409;
    message = 'A record with that value already exists';
  }

  const response: ErrorResponse = {
    success: false,
    message,
  };

  // Include stack trace only in development
  if (env.isDevelopment) {
    response.stack = err.stack;
  }

  console.error(`[Error] ${statusCode} — ${message}`, env.isDevelopment ? err : '');

  res.status(statusCode).json(response);
}
