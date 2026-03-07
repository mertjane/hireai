import express from 'express';
import * as analyticsController from './analytics.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// All analytics endpoints are protected
router.use(authenticate);

router.get('/funnel',       analyticsController.getFunnel);
router.get('/quality',      analyticsController.getQuality);
router.get('/scores',       analyticsController.getScores);
router.get('/trend',        analyticsController.getTrend);        // ?range=30d|90d|180d|all
router.get('/departments',  analyticsController.getDepartments);
router.get('/time-to-hire', analyticsController.getTimeToHire);

export default router;
