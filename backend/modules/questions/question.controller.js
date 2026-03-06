import * as questionService from './question.service.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import { handleError } from '../../utils/error.util.js';

export const createQuestion = async (req, res) => {
    try {
        const { question, category, is_temporary } = req.body;

        if (!question || !category) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
        }

        const payload = { question, category };
        // allow one-time questions that won't persist in the bank
        if (is_temporary) payload.is_temporary = true;

        const data = await questionService.createQuestion(req.company.id, payload);
        res.status(HTTP_STATUS.CREATED).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getQuestions = async (req, res) => {
    try {
        const { category } = req.query;
        // scope questions to the authenticated company
        const data = await questionService.getQuestions(req.company.id, category);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getQuestion = async (req, res) => {
    try {
        const data = await questionService.getQuestion(req.params.id);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const updateQuestion = async (req, res) => {
    try {
        const data = await questionService.updateQuestion(req.params.id, req.company.id, req.body);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        await questionService.deleteQuestion(req.params.id, req.company.id);
        res.status(HTTP_STATUS.OK).json({ message: 'Question deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
};
