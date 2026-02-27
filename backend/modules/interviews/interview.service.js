import { randomUUID, randomInt } from 'crypto';
import { createError } from '../../utils/error.util.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import * as interviewRepo from './interview.repository.js';

const assertFound = (interview) => {
    if (!interview) throw createError('Interview not found', HTTP_STATUS.NOT_FOUND);
};

// Generate a random 6-digit PIN for candidate verification
const generatePin = () => String(randomInt(100000, 999999));

export const scheduleInterview = async (company_id, payload) => {
    const token = randomUUID();
    const pin = generatePin();
    const access_link = `${process.env.APP_URL}/api/v1/interviews/token/${token}`;

    return await interviewRepo.createInterview({ ...payload, company_id, token, pin, access_link });
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

    // Strip pin from public response so candidates cannot read it from the API
    const { pin, ...safeInterview } = interview;
    return safeInterview;
};

export const verifyPin = async (token, pin) => {
    const interview = await interviewRepo.getInterviewByToken(token);
    if (!interview) throw createError('Interview not found', HTTP_STATUS.NOT_FOUND);
    if (interview.token_revoke) throw createError('This interview link has been revoked', HTTP_STATUS.UNAUTHORIZED);
    if (interview.pin !== pin) throw createError('Invalid PIN', HTTP_STATUS.UNAUTHORIZED);

    return { verified: true };
};

export const completeInterview = async (token) => {
    const interview = await interviewRepo.getInterviewByToken(token);
    if (!interview) throw createError('Interview not found', HTTP_STATUS.NOT_FOUND);
    if (interview.token_revoke) throw createError('This interview link has been revoked', HTTP_STATUS.UNAUTHORIZED);

    return await interviewRepo.updateInterviewByToken(token, { status: 'completed' });
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
