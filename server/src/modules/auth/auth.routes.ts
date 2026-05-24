import { Router } from 'express';
import { register, login, refreshToken, getMe, updateMe } from './auth.controller';
import { authenticate } from '../../common/middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);

export default router;
