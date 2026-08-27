import { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import { validateRequest } from '../middleware/validateRequest';
import { Question } from '../models/Question';
import { ApiError } from '../utils/ApiError';

export const createQuestionValidation = [
  body('text').trim().notEmpty().withMessage('Question text is required'),
  body('type').isIn(['rating', 'yesno', 'text']).withMessage('Invalid question type'),
  body('points').isInt({ min: 0 }).withMessage('Points must be a non-negative integer'),
  body('order').isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
  validateRequest,
];

export const updateQuestionValidation = [
  param('id').isMongoId().withMessage('Invalid question ID'),
  body('text').optional().trim().notEmpty().withMessage('Question text cannot be empty'),
  body('type').optional().isIn(['rating', 'yesno', 'text']).withMessage('Invalid question type'),
  body('points').optional().isInt({ min: 0 }).withMessage('Points must be a non-negative integer'),
  validateRequest,
];

// Mock in-memory question store for offline dev mode
let offlineQuestions: any[] = [
  { _id: '1', text: 'How would you rate the overall quality of supplied products?', type: 'rating', points: 1, order: 1, isActive: true },
  { _id: '2', text: 'Are deliveries generally made on time?', type: 'yesno', points: 1, order: 2, isActive: true },
  { _id: '3', text: 'How would you rate communication with the supplier?', type: 'rating', points: 1, order: 3, isActive: true },
  { _id: '4', text: 'Are invoices and documentation provided accurately?', type: 'yesno', points: 1, order: 4, isActive: true },
  { _id: '5', text: 'Would you recommend continuing business with this supplier?', type: 'yesno', points: 1, order: 5, isActive: true },
];

/** GET /api/questions */
export async function getQuestions(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: offlineQuestions });
      return;
    }
    const questions = await Question.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: questions });
  } catch (err) {
    next(err);
  }
}

/** POST /api/questions */
export async function createQuestion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      const newQ = { _id: Date.now().toString(), ...req.body, isActive: true };
      offlineQuestions.push(newQ);
      res.status(201).json({ success: true, data: newQ });
      return;
    }
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/questions/:id */
export async function updateQuestion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: { _id: req.params.id, ...req.body } });
      return;
    }
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!question) return next(ApiError.notFound('Question not found'));
    res.json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/questions/:id */
export async function deleteQuestion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      offlineQuestions = offlineQuestions.filter(q => q._id !== req.params.id);
      res.json({ success: true, message: 'Question archived successfully' });
      return;
    }
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!question) return next(ApiError.notFound('Question not found'));
    res.json({ success: true, message: 'Question archived successfully' });
  } catch (err) {
    next(err);
  }
}
