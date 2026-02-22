import * as questionService from './question.service.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import { handleError } from '../../utils/error.util.js';

export const createQuestion = async (req, res) => {
    try {
        const { question, category } = req.body;

        if (!question || !category) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
        }

        const data = await questionService.createQuestion({ question, category });
        res.status(HTTP_STATUS.CREATED).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getQuestions = async (req, res) => {
    try {
        const { category } = req.query;
        const data = await questionService.getQuestions(category);
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
        const data = await questionService.updateQuestion(req.params.id, req.body);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        await questionService.deleteQuestion(req.params.id);
        res.status(HTTP_STATUS.OK).json({ message: 'Question deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
};
