import * as iQuestionService from './iQuestion.service.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import { handleError } from '../../utils/error.util.js';

export const addQuestion = async (req, res) => {
    try {
        const { interview_id, question_id, q_timer } = req.body;

        if (!interview_id || !question_id) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
        }

        const data = await iQuestionService.addQuestion(req.company.id, { interview_id, question_id, q_timer });
        res.status(HTTP_STATUS.CREATED).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getInterviewQuestions = async (req, res) => {
    try {
        const { interview_id } = req.query;

        if (!interview_id) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'interview_id is required' });
        }

        const data = await iQuestionService.getInterviewQuestions(interview_id, req.company.id);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getInterviewQuestionsByToken = async (req, res) => {
    try {
        const data = await iQuestionService.getInterviewQuestionsByToken(req.params.token);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const updateInterviewQuestion = async (req, res) => {
    try {
        const data = await iQuestionService.updateInterviewQuestion(req.params.id, req.company.id, req.body);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const submitAnswer = async (req, res) => {
    try {
        const { token, q_answer } = req.body;

        if (!token || !q_answer) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
        }

        const data = await iQuestionService.submitAnswer(req.params.id, token, q_answer);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const deleteInterviewQuestion = async (req, res) => {
    try {
        await iQuestionService.deleteInterviewQuestion(req.params.id, req.company.id);
        res.status(HTTP_STATUS.OK).json({ message: 'Question removed from interview' });
    } catch (error) {
        handleError(res, error);
    }
};
