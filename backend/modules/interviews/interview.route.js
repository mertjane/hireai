import express from 'express';
import * as interviewController from './interview.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Public — candidate accesses interview via token link
router.get('/token/:token', interviewController.getInterviewByToken);
router.post('/token/:token/verify-pin', interviewController.verifyPin);
router.post('/token/:token/complete', interviewController.completeInterview);

// Protected — company operations
router.use(authenticate);
router.post('/', interviewController.scheduleInterview);
router.get('/', interviewController.getInterviews);
router.get('/:id', interviewController.getInterview);
router.put('/:id', interviewController.updateInterview);
router.delete('/:id', interviewController.cancelInterview);

export default router;
