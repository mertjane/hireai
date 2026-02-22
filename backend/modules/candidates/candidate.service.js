import { createError } from '../../utils/error.util.js';
import { HTTP_STATUS, DB_ERRORS } from '../../constants/statusCodes.js';
import * as candidateRepo from './candidate.repository.js';

const assertFound = (candidate) => {
    if (!candidate) throw createError('Candidate not found', HTTP_STATUS.NOT_FOUND);
};

export const createCandidate = async (company_id, payload) => {
    try {
        return await candidateRepo.createCandidate({ ...payload, company_id });
    } catch (error) {
        if (error.code === DB_ERRORS.DUPLICATE_KEY) {
            throw createError('This candidate has already applied for this job', HTTP_STATUS.CONFLICT);
        }
        throw error;
    }
};

export const getCandidates = async (company_id, job_id) => {
    return await candidateRepo.getCandidatesByCompany(company_id, job_id);
};

export const getCandidate = async (id, company_id) => {
    const candidate = await candidateRepo.getCandidateById(id, company_id);
    assertFound(candidate);
    return candidate;
};

export const updateCandidate = async (id, company_id, updates) => {
    const candidate = await candidateRepo.getCandidateById(id, company_id);
    assertFound(candidate);
    return await candidateRepo.updateCandidate(id, company_id, updates);
};
