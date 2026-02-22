import express from 'express';
import { handleLogin } from './login.controller.js';

const router = express.Router();


router.post('/', handleLogin);

export default router;