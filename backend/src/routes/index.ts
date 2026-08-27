import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes';
import supplierRoutes from './supplierRoutes';
import surveyRoutes from './surveyRoutes';
import questionRoutes from './questionRoutes';
import responseRoutes from './responseRoutes';
import exportRoutes from './exportRoutes';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/surveys', surveyRoutes);
router.use('/questions', questionRoutes);
router.use('/responses', responseRoutes);
router.use('/export', exportRoutes);

export default router;
