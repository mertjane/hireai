import { randomUUID } from 'crypto';
import { createError } from '../../utils/error.util.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import * as interviewRepo from './interview.repository.js';

const assertFound = (interview) => {
    if (!interview) throw createError('Interview not found', HTTP_STATUS.NOT_FOUND);
};

export const scheduleInterview = async (company_id, payload) => {
    const token = randomUUID();
    const access_link = `${process.env.APP_URL}/api/v1/interviews/token/${token}`;

    return await interviewRepo.createInterview({ ...payload, company_id, token, access_link });
};

export const getInterviews = async (company_id, filters) => {
    return await interviewRepo.getInterviewsByCompany(company_id, filters);
};

export const getInterview = async (id, company_id) => {
    const interview = await interviewRepo.getInterviewById(id, company_id);
    assertFound(interview);
    return interview;
};

export const getInterviewByToken = async (token) => {
    const interview = await interviewRepo.getInterviewByToken(token);
    if (!interview) throw createError('Interview not found', HTTP_STATUS.NOT_FOUND);
    if (interview.token_revoke) throw createError('This interview link has been revoked', HTTP_STATUS.UNAUTHORIZED);
    return interview;
};

export const updateInterview = async (id, company_id, updates) => {
    const interview = await interviewRepo.getInterviewById(id, company_id);
    assertFound(interview);
    return await interviewRepo.updateInterview(id, company_id, updates);
};

export const cancelInterview = async (id, company_id) => {
    const interview = await interviewRepo.getInterviewById(id, company_id);
    assertFound(interview);
    return await interviewRepo.updateInterview(id, company_id, { status: 'cancelled', token_revoke: true });
};
