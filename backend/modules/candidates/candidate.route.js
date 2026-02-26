import express from 'express';
import multer from 'multer';
import * as candidateController from './candidate.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        cb(null, allowed.includes(file.mimetype));
    },
});

// Public — candidates apply without auth
router.post('/', upload.single('cv'), candidateController.createCandidate);

// Protected — company-only operations
router.get('/', authenticate, candidateController.getCandidates);
router.get('/:id', authenticate, candidateController.getCandidate);
router.put('/:id', authenticate, candidateController.updateCandidate);

export default router;
