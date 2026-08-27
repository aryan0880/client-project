import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';

/**
 * Middleware to check express-validator results.
 * Place after validation chains in route definitions.
 * Returns 400 with structured error messages if validation fails.
 */
export function validateRequest(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((e) => e.msg)
      .join('; ');
    return next(ApiError.badRequest(messages));
  }
  next();
}
