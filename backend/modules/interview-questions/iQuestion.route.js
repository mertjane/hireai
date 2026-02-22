import express from 'express';
import * as iQuestionController from './iQuestion.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Public — candidate accesses questions via interview token
router.get('/token/:token', iQuestionController.getInterviewQuestionsByToken);
router.put('/:id/answer', iQuestionController.submitAnswer);

// Protected — company operations
router.use(authenticate);
router.post('/', iQuestionController.addQuestion);
router.get('/', iQuestionController.getInterviewQuestions);
router.put('/:id', iQuestionController.updateInterviewQuestion);
router.delete('/:id', iQuestionController.deleteInterviewQuestion);

export default router;
