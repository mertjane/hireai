import * as candidateService from './candidate.service.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import { handleError } from '../../utils/error.util.js';
import { uploadCV } from '../../utils/storage.util.js';
import { sendApplicationConfirmation } from '../smtp/smtp.service.js';

export const createCandidate = async (req, res) => {
    try {
        const { company_id, job_id, first_name, last_name, email, phone, job_title, company_name } = req.body;

        if (!company_id || !job_id || !first_name || !last_name || !email || !phone) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
        }

        let cv_url = null;
        if (req.file) {
            cv_url = await uploadCV(req.file);
        }

        const data = await candidateService.createCandidate(company_id, {
            job_id, first_name, last_name, email, phone, cv_url,
        });

        // Fire-and-forget — email failure does not affect the response
        sendApplicationConfirmation({
            to: email,
            firstName: first_name,
            jobTitle: job_title ?? 'the position',
            companyName: company_name ?? 'the company',
        }).catch((err) => console.error('[email] Failed to send confirmation:', err.message));

        res.status(HTTP_STATUS.CREATED).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getCandidates = async (req, res) => {
    try {
        const data = await candidateService.getCandidates(req.company.id, req.query.job_id);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getCandidate = async (req, res) => {
    try {
        const data = await candidateService.getCandidate(req.params.id, req.company.id);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const updateCandidate = async (req, res) => {
    try {
        const data = await candidateService.updateCandidate(req.params.id, req.company.id, req.body);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};
