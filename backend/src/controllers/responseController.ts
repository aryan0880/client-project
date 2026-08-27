import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { param, body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { Response as SurveyResponse } from '../models/Response';
import { SurveyAssignment } from '../models/SurveyAssignment';
import { ApiError } from '../utils/ApiError';
import { calculateScore } from '../services/scoreService';

export const submitResponseValidation = [
  param('token').isLength({ min: 64, max: 64 }).withMessage('Invalid survey token'),
  body('answers').isArray({ min: 1 }).withMessage('Answers are required'),
  body('answers.*.question').isMongoId().withMessage('Invalid question ID in answers'),
  body('answers.*.value').notEmpty().withMessage('Each answer must have a value'),
  validateRequest,
];

/**
 * GET /api/responses/survey/:token
 * Public endpoint — returns the survey + supplier info for the supplier to fill in.
 */
export async function getSurveyByToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assignment = await SurveyAssignment.findOne({ token: req.params.token })
      .populate({
        path: 'survey',
        populate: { path: 'questions', options: { sort: { order: 1 } } },
      })
      .populate('supplier', 'name email');

    if (!assignment) return next(ApiError.notFound('Survey not found or link is invalid'));

    if (assignment.status === 'submitted') {
      res.json({
        success: true,
        data: { alreadySubmitted: true, assignment },
      });
      return;
    }

    res.json({ success: true, data: { alreadySubmitted: false, assignment } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/responses/survey/:token
 * Supplier submits answers. Score is calculated SERVER-SIDE only.
 */
export async function submitResponse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const { answers } = req.body as {
      answers: Array<{ question: string; value: string }>;
    };

    // Validate token
    const assignment = await SurveyAssignment.findOne({ token });
    if (!assignment) return next(ApiError.notFound('Survey not found or link is invalid'));

    // Prevent double submission
    if (assignment.status === 'submitted') {
      return next(ApiError.badRequest('This survey has already been submitted'));
    }

    // Cast raw answers to Mongoose ObjectId answers
    const formattedAnswers = answers.map((a) => ({
      question: new mongoose.Types.ObjectId(a.question),
      value: a.value,
    }));

    // Calculate score server-side — never trust client-submitted scores
    const { totalScore, maxPossibleScore, percentageScore } = await calculateScore(formattedAnswers as any);
    // Save response
    const response = await SurveyResponse.create({
      assignment: assignment._id,
      answers: formattedAnswers,
      totalScore,
      maxPossibleScore,
    });

    // Mark assignment as submitted
    assignment.status = 'submitted';
    assignment.submittedAt = new Date();
    await assignment.save();

    res.status(201).json({
      success: true,
      message: 'Survey submitted successfully. Thank you!',
      data: {
        responseId: (response as any)._id,
        totalScore,
        maxPossibleScore,
        percentageScore,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/responses — Admin: view all responses with supplier and survey info */
export async function getResponses(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: [] });
      return;
    }
    const responses = await SurveyResponse.find()
      .populate({
        path: 'assignment',
        populate: [
          { path: 'survey', select: 'title' },
          { path: 'supplier', select: 'name email' },
        ],
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: responses });
  } catch (err) {
    next(err);
  }
}

/** GET /api/responses/:id — Admin: view a single response with full answer breakdown */
export async function getResponse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const response = await SurveyResponse.findById(req.params.id).populate({
      path: 'assignment',
      populate: [
        {
          path: 'survey',
          populate: { path: 'questions', options: { sort: { order: 1 } } },
        },
        { path: 'supplier', select: 'name email' },
      ],
    });

    if (!response) return next(ApiError.notFound('Response not found'));
    res.json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
}
