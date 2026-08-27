import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import { validateRequest } from '../middleware/validateRequest';
import { Survey } from '../models/Survey';
import { ApiError } from '../utils/ApiError';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const createSurveyValidation = [
  body('title').trim().notEmpty().withMessage('Survey title is required'),
  body('description').optional().trim(),
  body('questions').optional().isArray().withMessage('Questions must be an array'),
  validateRequest,
];

/** GET /api/surveys */
export async function getSurveys(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({
        success: true,
        data: [
          {
            _id: '1',
            title: 'Supplier Performance Assessment - Test',
            description: 'A standardised assessment to evaluate supplier performance.',
            status: 'active',
            questions: [
              { _id: '1', text: 'How would you rate the overall quality of supplied products?', type: 'rating', points: 1, order: 1 },
              { _id: '2', text: 'Are deliveries generally made on time?', type: 'yesno', points: 1, order: 2 },
            ],
            createdAt: new Date(),
          },
        ],
      });
      return;
    }
    const surveys = await Survey.find()
      .populate('questions', 'text type points order')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: surveys });
  } catch (err) {
    next(err);
  }
}

/** GET /api/surveys/:id */
export async function getSurvey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const survey = await Survey.findById(req.params.id)
      .populate('questions')
      .populate('createdBy', 'name email');
    if (!survey) return next(ApiError.notFound('Survey not found'));
    res.json({ success: true, data: survey });
  } catch (err) {
    next(err);
  }
}

/** POST /api/surveys */
export async function createSurvey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      const newSurvey = {
        _id: Date.now().toString(),
        ...req.body,
        status: req.body.status || 'active',
        createdAt: new Date(),
      };
      res.status(201).json({ success: true, data: newSurvey });
      return;
    }
    const survey = await Survey.create({
      ...req.body,
      createdBy: req.user?.id ?? '000000000000000000000000',
    });
    res.status(201).json({ success: true, data: survey });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/surveys/:id */
export async function updateSurvey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const survey = await Survey.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!survey) return next(ApiError.notFound('Survey not found'));
    res.json({ success: true, data: survey });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/surveys/:id */
export async function deleteSurvey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    if (!survey) return next(ApiError.notFound('Survey not found'));
    res.json({ success: true, message: 'Survey deleted successfully' });
  } catch (err) {
    next(err);
  }
}
