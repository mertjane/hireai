import * as jobsService from './jobs.service.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import { handleError } from '../../utils/error.util.js';

export const createJob = async (req, res) => {
    try {
        const { title, department, location, work_type, status, description } = req.body;

        if (!title || !department || !location || !description) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
        }

        const data = await jobsService.createJob(req.company.id, { title, department, location, work_type, status, description });
        res.status(HTTP_STATUS.CREATED).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getJobs = async (req, res) => {
    try {
        const data = req.company
            ? await jobsService.getJobs(req.company.id)
            : await jobsService.getAllJobs();
        res.status(HTTP_STATUS.OK).json({ jobs: data });
    } catch (error) {
        handleError(res, error);
    }
};

export const getJob = async (req, res) => {
    try {
        const data = req.company
            ? await jobsService.getJob(req.params.id, req.company.id)
            : await jobsService.getJobPublic(req.params.id);
        res.status(HTTP_STATUS.OK).json({ jobs: data });
    } catch (error) {
        handleError(res, error);
    }
};

export const updateJob = async (req, res) => {
    try {
        const data = await jobsService.updateJob(req.params.id, req.company.id, req.body);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const deleteJob = async (req, res) => {
    try {
        await jobsService.deleteJob(req.params.id, req.company.id);
        res.status(HTTP_STATUS.OK).json({ message: 'Job deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
};
