import { Router } from 'express';
import {
  getSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  createSurveyValidation,
} from '../controllers/surveyController';
import {
  assignSurvey,
  sendSurveyEmails,
  getSurveyAssignments,
  assignSurveyValidation,
} from '../controllers/assignmentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public read routes
router.get('/', getSurveys);
router.get('/:id', getSurvey);

// Protected survey creator routes
router.post('/', authMiddleware, createSurveyValidation, createSurvey);
router.put('/:id', authMiddleware, updateSurvey);
router.delete('/:id', authMiddleware, deleteSurvey);

// Protected assignment routes
router.post('/:id/assign', authMiddleware, assignSurveyValidation, assignSurvey);
router.post('/:id/send', authMiddleware, sendSurveyEmails);
router.get('/:id/assignments', authMiddleware, getSurveyAssignments);

export default router;
