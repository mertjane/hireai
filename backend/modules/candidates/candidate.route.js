import express from 'express';
import * as candidateController from './candidate.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Public — candidates apply without auth
router.post('/', candidateController.createCandidate);

// Protected — company-only operations
router.get('/', authenticate, candidateController.getCandidates);
router.get('/:id', authenticate, candidateController.getCandidate);
router.put('/:id', authenticate, candidateController.updateCandidate);

export default router;
