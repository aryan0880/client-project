import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { validateRequest } from '../middleware/validateRequest';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

import mongoose from 'mongoose';

// Validation rules for login
export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest,
];

/**
 * POST /api/auth/login
 * Verifies credentials against DB, issues JWT on success.
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    let user = null;

    // Check if database is connected before querying
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email }).select('+password');
    } else {
      console.warn('[DB] MongoDB is offline. Bypassing query to prevent buffering timeout.');
    }

    if (!user) {
      // In development, if DB is disconnected/unseeded, fallback to stub credentials
      if (env.isDevelopment && email === 'admin@company.com' && password === 'Admin123!') {
        const token = jwt.sign(
          { id: 'stub-id', email, role: 'admin' },
          env.jwtSecret,
          { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
        );
        res.json({
          success: true,
          data: {
            token,
            user: {
              id: 'stub-id',
              name: 'Admin User (Offline Fallback)',
              email,
              role: 'admin',
            },
          },
        });
        return;
      }
      return next(ApiError.unauthorized('Invalid email or password'));
    }

    // Verify password with bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(ApiError.unauthorized('Invalid email or password'));
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile from the JWT.
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      if (env.isDevelopment) {
        res.json({
          success: true,
          data: {
            _id: 'stub-id',
            name: 'Admin User (Offline Fallback)',
            email: req.user?.email || 'admin@company.com',
            role: 'admin',
          },
        });
        return;
      }
      return next(ApiError.internal('Database connection is offline'));
    }

    const user = await User.findById(req.user?.id).select('-password');
    if (!user) return next(ApiError.notFound('User not found'));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * JWT is stateless — client simply discards the token.
 */
export async function logout(
  _req: Request,
  res: Response
): Promise<void> {
  res.json({ success: true, message: 'Logged out successfully' });
}
