import express from 'express';
import * as jobsController from './jobs.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes — no auth required
router.get('/', jobsController.getJobs);
router.get('/:id', jobsController.getJob);

// Protected routes — company/admin only
router.post('/', authenticate, jobsController.createJob);
router.put('/:id', authenticate, jobsController.updateJob);
router.delete('/:id', authenticate, jobsController.deleteJob);

export default router;
