import express from 'express';
import cors from 'cors'; // Added cors to allow frontend-backend communication across origins - Bora
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';
import registerRoutes from './modules/auth/register/register.route.js';
import loginRoutes from './modules/auth/login/login.route.js';
import jobsRoutes from './modules/jobs/jobs.route.js';
import candidatesRoutes from './modules/candidates/candidate.route.js';
import interviewsRoutes from './modules/interviews/interview.route.js';
import questionsRoutes from './modules/questions/question.route.js';
import iQuestionRoutes from './modules/interview-questions/iQuestion.route.js';

const app = express();
app.use(cors()); // Enabled CORS for all origins in dev; restrict in production - Bora
app.use(express.json());

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API Routes
app.use('/api/v1/auth/register', registerRoutes);
app.use('/api/v1/auth/login', loginRoutes);
app.use('/api/v1/jobs', jobsRoutes);
app.use('/api/v1/candidates', candidatesRoutes);
app.use('/api/v1/interviews', interviewsRoutes);
app.use('/api/v1/questions', questionsRoutes);
app.use('/api/v1/interview-questions', iQuestionRoutes);

export default app;