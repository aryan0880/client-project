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
 * Returns emailConfigured flag so the frontend can distinguish config issues from send failures.
 */
export async function sendSurveyEmails(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return next(ApiError.notFound('Survey not found'));

    // Determine if email is configured (SMTP or Resend API)
    const emailConfigured =
      (!!env.smtpUser && !!env.smtpPass) ||
      (!!env.resendApiKey && !env.resendApiKey.startsWith('re_replace') && env.resendApiKey.length > 10);

    const assignments = await SurveyAssignment.find({
      survey: survey._id,
      status: 'pending',
    }).populate<{ supplier: { name: string; email: string; _id: string } }>('supplier', 'name email');

    if (assignments.length === 0) {
      res.json({
        success: true,
        message: 'No pending assignments to send emails to.',
        data: { sent: 0, total: 0, failed: [], links: [], emailConfigured },
      });
      return;
    }

    let sent = 0;
    const errors: string[] = [];
    const generatedLinks: Array<{ supplier: string; email: string; link: string }> = [];

    for (const assignment of assignments) {
      const supplier = assignment.supplier as { name: string; email: string } | null;
      if (!supplier) {
        console.warn(`[Warn] Supplier not found for assignment ${assignment._id}, skipping email.`);
        continue;
      }
      const surveyUrl = `${env.frontendUrl}/survey/${assignment.token}`;
      generatedLinks.push({ supplier: supplier.name, email: supplier.email, link: surveyUrl });

      console.log(`\n======================================================`);
      console.log(`[SURVEY INVITATION LINK FOR ${supplier.name} (${supplier.email})]:`);
      console.log(`🔗 ${surveyUrl}`);
      console.log(`======================================================\n`);

      if (emailConfigured) {
        try {
          const success = await sendSurveyInvitation({
            supplierEmail: supplier.email,
            supplierName: supplier.name,
            surveyTitle: survey.title,
            surveyToken: assignment.token,
          });
          if (success) {
            sent++;
            // Record when the invitation email was dispatched
            assignment.sentAt = new Date();
            await assignment.save();
          } else {
            errors.push(supplier.email);
          }
        } catch (e) {
          errors.push(supplier.email);
        }
      }
    }

    res.json({
      success: true,
      message: emailConfigured
        ? `Survey links generated for ${assignments.length} supplier(s). ${sent > 0 ? `Email sent to ${sent} inbox(es).` : `Email sending failed for all ${assignments.length} supplier(s). Links generated — use Copy Link to share manually.`}`
        : `Survey links generated for ${assignments.length} supplier(s). Email not configured — use Copy Link to share manually.`,
      data: { sent, total: assignments.length, failed: errors, links: generatedLinks, emailConfigured },
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
