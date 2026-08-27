import { Router, Request, Response, NextFunction } from 'express';
import { generateSurveyExcel } from '../services/exportService';
import { authMiddleware } from '../middleware/authMiddleware';
import { Survey } from '../models/Survey';
import { ApiError } from '../utils/ApiError';

const router = Router();

/**
 * GET /api/export/survey/:id
 * Protected admin route to export all survey responses to Excel.
 */
router.get(
  '/survey/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const surveyId = req.params.id as string;

      // Verify survey exists
      const survey = await Survey.findById(surveyId);
      if (!survey) return next(ApiError.notFound('Survey not found'));

      // Generate workbook buffer
      const buffer = await generateSurveyExcel(surveyId);

      // Clean file name
      const safeTitle = survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `responses_${safeTitle}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );

      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
