import { createError } from '../../utils/error.util.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import * as jobsRepo from './jobs.repository.js';

const assertFound = (job) => {
    if (!job) throw createError('Job not found', HTTP_STATUS.NOT_FOUND);
};

export const createJob = async (company_id, payload) => {
    return await jobsRepo.createJob({ ...payload, company_id });
};

export const getJobs = async (company_id) => {
    return await jobsRepo.getJobsByCompany(company_id);
};

export const getAllJobs = async () => {
    return await jobsRepo.getAllJobs();
};

export const getJob = async (id, company_id) => {
    const job = await jobsRepo.getJobById(id, company_id);
    assertFound(job);
    return job;
};

export const getJobPublic = async (id) => {
    const job = await jobsRepo.getJobByIdPublic(id);
    assertFound(job);
    return job;
};

export const updateJob = async (id, company_id, updates) => {
    const job = await jobsRepo.getJobById(id, company_id);
    assertFound(job);
    return await jobsRepo.updateJob(id, company_id, updates);
};

export const deleteJob = async (id, company_id) => {
    const job = await jobsRepo.getJobById(id, company_id);
    assertFound(job);
    await jobsRepo.deleteJob(id, company_id);
};
