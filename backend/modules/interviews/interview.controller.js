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
