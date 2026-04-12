import { Router } from 'express';
import analyticsRoutes from './analytics.routes.js';
import { healthCheck } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/health', healthCheck);
router.use('/analytics', analyticsRoutes);

export default router;
