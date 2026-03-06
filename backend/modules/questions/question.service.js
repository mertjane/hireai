import { createError } from '../../utils/error.util.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import * as questionRepo from './question.repository.js';

const assertFound = (question) => {
    if (!question) throw createError('Question not found', HTTP_STATUS.NOT_FOUND);
};

// only company-created questions can be modified — default questions are read-only
const assertOwnership = (question, companyId) => {
    if (!question.company_id) {
        throw createError('Cannot modify default questions', HTTP_STATUS.FORBIDDEN);
    }
    if (question.company_id !== companyId) {
        throw createError('You can only modify your own questions', HTTP_STATUS.FORBIDDEN);
    }
};

export const createQuestion = async (companyId, payload) => {
    // tag the question with the creating company
    return await questionRepo.createQuestion({ ...payload, company_id: companyId });
};

export const getQuestions = async (companyId, category) => {
    return await questionRepo.getQuestions(companyId, category);
};

export const getQuestion = async (id) => {
    const question = await questionRepo.getQuestionById(id);
    assertFound(question);
    return question;
};

export const updateQuestion = async (id, companyId, updates) => {
    const question = await questionRepo.getQuestionById(id);
    assertFound(question);
    assertOwnership(question, companyId);
    return await questionRepo.updateQuestion(id, updates);
};

export const deleteQuestion = async (id, companyId) => {
    const question = await questionRepo.getQuestionById(id);
    assertFound(question);
    assertOwnership(question, companyId);
    await questionRepo.deleteQuestion(id);
};
