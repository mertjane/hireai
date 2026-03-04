import { randomUUID, randomInt } from 'crypto';
import { createError } from '../../utils/error.util.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import * as interviewRepo from './interview.repository.js';
import * as candidateRepo from '../candidates/candidate.repository.js';
import { sendInterviewInvitation, sendHelpRequest } from '../smtp/smtp.service.js';

const assertFound = (interview) => {
    if (!interview) throw createError('Interview not found', HTTP_STATUS.NOT_FOUND);
};

// Generate a random 6-digit PIN for candidate verification
const generatePin = () => String(randomInt(100000, 999999));

// simple in-memory counter to prevent help request spam (max 3 per interview)
const helpRequestCounts = new Map();
const MAX_HELP_REQUESTS = 3;

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

// Send a help request email to the company that owns this interview
export const submitHelpRequest = async (token, message) => {
    const interview = await interviewRepo.getInterviewByToken(token);
    if (!interview) throw createError('Interview not found', HTTP_STATUS.NOT_FOUND);

    // rate limit per interview to prevent abuse
    const count = helpRequestCounts.get(interview.id) || 0;
    if (count >= MAX_HELP_REQUESTS) {
        throw createError('Help request limit reached for this interview', HTTP_STATUS.TOO_MANY_REQUESTS);
    }
    helpRequestCounts.set(interview.id, count + 1);

    const companyEmail = interview.companies?.email;
    if (!companyEmail) throw createError('Company contact not available', HTTP_STATUS.INTERNAL_SERVER_ERROR);

    const candidateName = interview.candidates
        ? `${interview.candidates.first_name} ${interview.candidates.last_name}`.trim()
        : 'Unknown candidate';

    await sendHelpRequest({
        to: companyEmail,
        candidateName,
        companyName: interview.companies?.name || 'Your company',
        message,
    });

    return { sent: true };
};

// Store candidate feedback after interview completion
export const submitFeedback = async (token, { feedback_rating, feedback_comment }) => {
    const interview = await interviewRepo.getInterviewByToken(token);
    if (!interview) throw createError('Interview not found', HTTP_STATUS.NOT_FOUND);

    return await interviewRepo.updateInterviewByToken(token, { feedback_rating, feedback_comment });
};

export const updateInterview = async (id, company_id, updates) => {
    const interview = await interviewRepo.getInterviewById(id, company_id);
    assertFound(interview);
    return await interviewRepo.updateInterview(id, company_id, updates);
};

export const cancelInterview = async (id, company_id) => {
    const interview = await interviewRepo.getInterviewById(id, company_id);
    assertFound(interview);

    // reset candidate status so they can be re-invited
    if (interview.candidate_id) {
        candidateRepo.updateCandidate(interview.candidate_id, company_id, { status: 'pending' })
            .catch((err) => console.error('[interview] candidate status reset failed:', err.message));
    }

    return await interviewRepo.updateInterview(id, company_id, { status: 'cancelled', token_revoke: true });
};
