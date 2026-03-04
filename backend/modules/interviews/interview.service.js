import { randomUUID, randomInt } from 'crypto';
import { createError } from '../../utils/error.util.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import * as interviewRepo from './interview.repository.js';
import * as candidateRepo from '../candidates/candidate.repository.js';
import { sendInterviewInvitation } from '../smtp/smtp.service.js';

const assertFound = (interview) => {
    if (!interview) throw createError('Interview not found', HTTP_STATUS.NOT_FOUND);
};

// Generate a random 6-digit PIN for candidate verification
const generatePin = () => String(randomInt(100000, 999999));

export const scheduleInterview = async (company_id, payload) => {
    const { candidate_id, job_id, scheduled_at, duration_minutes, job_title, company_name } = payload;

    const token = randomUUID();
    const pin = generatePin();
    const access_link = `${process.env.APP_URL}/api/v1/interviews/token/${token}`;

    const interview = await interviewRepo.createInterview({
        candidate_id, job_id, scheduled_at, duration_minutes,
        company_id, token, pin, access_link,
    });

    // Update candidate status + send invitation email (fire-and-forget)
    candidateRepo.getCandidateById(candidate_id, company_id)
        .then((candidate) => {
            if (!candidate) return;

            candidateRepo.updateCandidate(candidate_id, company_id, { status: 'in_progress' })
                .catch((err) => console.error('[interview] candidate status update failed:', err.message));

            const formattedDate = new Date(scheduled_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });

            sendInterviewInvitation({
                to: candidate.email,
                firstName: candidate.first_name,
                jobTitle: job_title ?? 'the position',
                companyName: company_name ?? 'the company',
                interviewLink: access_link,
                scheduledAt: formattedDate,
                pin,
            }).catch((err) => console.error('[interview] invitation email failed:', err.message));
        })
        .catch((err) => console.error('[interview] candidate fetch failed:', err.message));

    return interview;
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

    // Strip pin and flatten joined names into simple top-level fields
    const { pin, candidates, companies, ...safeInterview } = interview;
    return {
        ...safeInterview,
        candidate_name: candidates ? `${candidates.first_name} ${candidates.last_name}`.trim() : undefined,
        company_name: companies?.name || undefined,
    };
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
