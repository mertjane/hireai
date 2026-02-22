import express from 'express';
import { handleRegister } from './register.controller.js';

const router = express.Router();


router.post('/', handleRegister);

export default router;