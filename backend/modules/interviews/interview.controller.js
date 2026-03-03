import * as interviewService from './interview.service.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import { handleError } from '../../utils/error.util.js';

export const scheduleInterview = async (req, res) => {
    try {
        const { candidate_id, job_id, scheduled_at, duration_minutes } = req.body;

        if (!candidate_id || !job_id || !scheduled_at) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
        }

        const data = await interviewService.scheduleInterview(req.company.id, { candidate_id, job_id, scheduled_at, duration_minutes });
        res.status(HTTP_STATUS.CREATED).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getInterviews = async (req, res) => {
    try {
        const { job_id, candidate_id } = req.query;
        const data = await interviewService.getInterviews(req.company.id, { job_id, candidate_id });
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getInterview = async (req, res) => {
    try {
        const data = await interviewService.getInterview(req.params.id, req.company.id);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getInterviewByToken = async (req, res) => {
    try {
        const data = await interviewService.getInterviewByToken(req.params.token);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const updateInterview = async (req, res) => {
    try {
        const data = await interviewService.updateInterview(req.params.id, req.company.id, req.body);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const cancelInterview = async (req, res) => {
    try {
        const data = await interviewService.cancelInterview(req.params.id, req.company.id);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

// Public — candidate verifies their PIN before the interview starts
export const verifyPin = async (req, res) => {
    try {
        const { pin } = req.body;

        if (!pin) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'PIN is required' });
        }

        const data = await interviewService.verifyPin(req.params.token, pin);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

// Public — candidate requests help during the interview
export const submitHelpRequest = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Message is required' });
        }

        // cap message length to prevent abuse
        const sanitized = message.trim().slice(0, 500);

        const data = await interviewService.submitHelpRequest(req.params.token, sanitized);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

// Public — candidate submits feedback after finishing the interview
export const submitFeedback = async (req, res) => {
    try {
        const { feedback_rating, feedback_comment } = req.body;

        if (!feedback_rating || feedback_rating < 1 || feedback_rating > 5) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Rating must be between 1 and 5' });
        }

        const data = await interviewService.submitFeedback(req.params.token, {
            feedback_rating,
            feedback_comment: feedback_comment || null,
        });
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

// Public — candidate marks interview as completed after answering all questions
export const completeInterview = async (req, res) => {
    try {
        const data = await interviewService.completeInterview(req.params.token);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};
