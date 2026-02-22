import { createError } from '../../utils/error.util.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import * as questionRepo from './question.repository.js';

const assertFound = (question) => {
    if (!question) throw createError('Question not found', HTTP_STATUS.NOT_FOUND);
};

export const createQuestion = async (payload) => await questionRepo.createQuestion(payload);

export const getQuestions = async (category) => await questionRepo.getQuestions(category);

export const getQuestion = async (id) => {
    const question = await questionRepo.getQuestionById(id);
    assertFound(question);
    return question;
};

export const updateQuestion = async (id, updates) => {
    const question = await questionRepo.getQuestionById(id);
    assertFound(question);
    return await questionRepo.updateQuestion(id, updates);
};

export const deleteQuestion = async (id) => {
    const question = await questionRepo.getQuestionById(id);
    assertFound(question);
    await questionRepo.deleteQuestion(id);
};
