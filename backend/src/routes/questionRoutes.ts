import { Router } from 'express';
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createQuestionValidation,
  updateQuestionValidation,
} from '../controllers/questionController';

const router = Router();

router.get('/', getQuestions);
router.post('/', createQuestionValidation, createQuestion);
router.put('/:id', updateQuestionValidation, updateQuestion);
router.delete('/:id', deleteQuestion);

export default router;
