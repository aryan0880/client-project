import { Router } from 'express';
import { login, logout, getMe, loginValidation } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);

export default router;
