import { createError } from '../../utils/error.util.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import * as iQuestionRepo from './iQuestion.repository.js';
import * as interviewRepo from '../interviews/interview.repository.js';

const assertFound = (item) => {
    if (!item) throw createError('Interview question not found', HTTP_STATUS.NOT_FOUND);
};

const verifyInterview = async (interview_id, company_id) => {
    const interview = await interviewRepo.getInterviewById(interview_id, company_id);
    if (!interview) throw createError('Interview not found', HTTP_STATUS.NOT_FOUND);
    return interview;
};

export const addQuestion = async (company_id, { interview_id, question_id, q_timer }) => {
    await verifyInterview(interview_id, company_id);
    return await iQuestionRepo.addQuestion({ interview_id, question_id, q_timer: q_timer ?? 0 });
};

export const getInterviewQuestions = async (interview_id, company_id) => {
    await verifyInterview(interview_id, company_id);
    return await iQuestionRepo.getByInterviewId(interview_id);
};

export const getInterviewQuestionsByToken = async (token) => {
    const interview = await interviewRepo.getInterviewByToken(token);
    if (!interview) throw createError('Interview not found', HTTP_STATUS.NOT_FOUND);
    if (interview.token_revoke) throw createError('This interview link has been revoked', HTTP_STATUS.UNAUTHORIZED);
    return await iQuestionRepo.getByInterviewId(interview.id);
};

export const updateInterviewQuestion = async (id, company_id, updates) => {
    const iq = await iQuestionRepo.getById(id);
    assertFound(iq);
    await verifyInterview(iq.interview_id, company_id);
    return await iQuestionRepo.updateById(id, updates);
};

export const submitAnswer = async (id, token, q_answer) => {
    const interview = await interviewRepo.getInterviewByToken(token);
    if (!interview) throw createError('Interview not found', HTTP_STATUS.NOT_FOUND);
    if (interview.token_revoke) throw createError('This interview link has been revoked', HTTP_STATUS.UNAUTHORIZED);

    const iq = await iQuestionRepo.getById(id);
    assertFound(iq);
    if (iq.interview_id !== interview.id) throw createError('Question not found in this interview', HTTP_STATUS.NOT_FOUND);

    return await iQuestionRepo.updateById(id, { q_answer });
};

export const deleteInterviewQuestion = async (id, company_id) => {
    const iq = await iQuestionRepo.getById(id);
    assertFound(iq);
    await verifyInterview(iq.interview_id, company_id);
    await iQuestionRepo.deleteById(id);
};
