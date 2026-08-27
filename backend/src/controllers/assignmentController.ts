import { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { Survey } from '../models/Survey';
import { Supplier } from '../models/Supplier';
import { SurveyAssignment } from '../models/SurveyAssignment';
import { ApiError } from '../utils/ApiError';
import { generateSurveyToken } from '../utils/tokenGenerator';
import { sendSurveyInvitation } from '../services/emailService';
import { env } from '../config/env';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

export const assignSurveyValidation = [
  param('id').isMongoId().withMessage('Invalid survey ID'),
  body('supplierIds')
    .isArray({ min: 1 })
    .withMessage('At least one supplier ID is required'),
  body('supplierIds.*').isMongoId().withMessage('Invalid supplier ID'),
  validateRequest,
];

/**
 * POST /api/surveys/:id/assign
 * Assign a survey to one or more suppliers — creates a SurveyAssignment with a unique token per supplier.
 * Skips suppliers who already have an active assignment for this survey.
 */
export async function assignSurvey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return next(ApiError.notFound('Survey not found'));

    const { supplierIds } = req.body as { supplierIds: string[] };

    const assignments: typeof SurveyAssignment.prototype[] = [];
    const skipped: string[] = [];

    for (const supplierId of supplierIds) {
      // Check if assignment already exists for this supplier+survey
      const existing = await SurveyAssignment.findOne({
        survey: survey._id,
        supplier: supplierId,
      });

      if (existing) {
        skipped.push(supplierId);
        continue;
      }

      const token = generateSurveyToken();
      const assignment = await SurveyAssignment.create({
        survey: survey._id,
        supplier: supplierId,
        token,
        status: 'pending',
      });
      assignments.push(assignment);
    }

    res.status(201).json({
      success: true,
      message: `Survey assigned to ${assignments.length} supplier(s). ${skipped.length} already assigned (skipped).`,
      data: { assignments, skipped },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/surveys/:id/send
 * Send survey invitation emails to all pending suppliers.
 * Idempotent — only sends to those not yet emailed.
 */
export async function sendSurveyEmails(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return next(ApiError.notFound('Survey not found'));

    const assignments = await SurveyAssignment.find({
      survey: survey._id,
      status: 'pending',
    }).populate<{ supplier: { name: string; email: string; _id: string } }>('supplier', 'name email');

    if (assignments.length === 0) {
      res.json({
        success: true,
        message: 'No pending assignments to send emails to.',
        data: { sent: 0 },
      });
      return;
    }

    let sent = 0;
    const errors: string[] = [];
    const generatedLinks: Array<{ supplier: string; email: string; link: string }> = [];

    for (const assignment of assignments) {
      const supplier = assignment.supplier as { name: string; email: string };
      const surveyUrl = `${env.frontendUrl}/survey/${assignment.token}`;
      generatedLinks.push({ supplier: supplier.name, email: supplier.email, link: surveyUrl });

      console.log(`\n======================================================`);
      console.log(`[SURVEY INVITATION LINK FOR ${supplier.name} (${supplier.email})]:`);
      console.log(`🔗 ${surveyUrl}`);
      console.log(`======================================================\n`);

      try {
        const success = await sendSurveyInvitation({
          supplierEmail: supplier.email,
          supplierName: supplier.name,
          surveyTitle: survey.title,
          surveyToken: assignment.token,
        });
        if (success) sent++;
      } catch (e) {
        errors.push(supplier.email);
      }
    }

    res.json({
      success: true,
      message: `Survey links generated for ${assignments.length} supplier(s). ${sent > 0 ? `Real email sent to ${sent} inbox(es).` : 'Check terminal or links below to test.'}`,
      data: { sent, total: assignments.length, failed: errors, links: generatedLinks },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/surveys/:id/assignments
 * Returns all assignments (pending + submitted) for a survey — admin only.
 */
export async function getSurveyAssignments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assignments = await SurveyAssignment.find({ survey: req.params.id })
      .populate('supplier', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
}
