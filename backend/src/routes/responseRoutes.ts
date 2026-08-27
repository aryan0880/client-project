import { Router } from 'express';
import {
  getSurveyByToken,
  submitResponse,
  getResponses,
  getResponse,
  submitResponseValidation,
} from '../controllers/responseController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public endpoints — accessed by supplier via tokenized link
router.get('/survey/:token', getSurveyByToken);
router.post('/survey/:token', submitResponseValidation, submitResponse);

// Admin endpoints (protected)
router.get('/', authMiddleware, getResponses);
router.get('/:id', authMiddleware, getResponse);

export default router;
