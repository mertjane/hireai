import express from 'express';
import * as jobsController from './jobs.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', jobsController.createJob);
router.get('/', jobsController.getJobs);
router.get('/:id', jobsController.getJob);
router.put('/:id', jobsController.updateJob);
router.delete('/:id', jobsController.deleteJob);

export default router;
