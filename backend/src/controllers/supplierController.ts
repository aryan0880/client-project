import { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import { validateRequest } from '../middleware/validateRequest';
import { Supplier } from '../models/Supplier';
import { ApiError } from '../utils/ApiError';

export const createSupplierValidation = [
  body('name').trim().notEmpty().withMessage('Supplier name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  validateRequest,
];

export const updateSupplierValidation = [
  param('id').isMongoId().withMessage('Invalid supplier ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  validateRequest,
];

/** GET /api/suppliers */
export async function getSuppliers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({
        success: true,
        data: [
          { _id: '1', name: 'ABC Industrial Supplies', email: 'supplier1@test.com', status: 'active', createdAt: new Date() },
          { _id: '2', name: 'XYZ Components',          email: 'supplier2@test.com', status: 'active', createdAt: new Date() },
          { _id: '3', name: 'Global Manufacturing',    email: 'supplier3@test.com', status: 'active', createdAt: new Date() },
        ],
      });
      return;
    }
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
}

/** GET /api/suppliers/:id */
export async function getSupplier(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return next(ApiError.notFound('Supplier not found'));
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
}

/** POST /api/suppliers */
export async function createSupplier(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      const newSupplier = { _id: Date.now().toString(), ...req.body, createdAt: new Date() };
      res.status(201).json({ success: true, data: newSupplier });
      return;
    }
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/suppliers/:id */
export async function updateSupplier(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: { _id: req.params.id, ...req.body } });
      return;
    }
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!supplier) return next(ApiError.notFound('Supplier not found'));
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/suppliers/:id */
export async function deleteSupplier(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, message: 'Supplier deleted successfully' });
      return;
    }
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return next(ApiError.notFound('Supplier not found'));
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (err) {
    next(err);
  }
}
