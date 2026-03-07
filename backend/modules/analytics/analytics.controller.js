import * as analyticsService from './analytics.service.js';
import { HTTP_STATUS } from '../../constants/statusCodes.js';
import { handleError } from '../../utils/error.util.js';

export const getFunnel = async (req, res) => {
    try {
        const data = await analyticsService.getFunnel(req.company.id);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getQuality = async (req, res) => {
    try {
        const data = await analyticsService.getQuality(req.company.id);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getScores = async (req, res) => {
    try {
        const data = await analyticsService.getScores(req.company.id);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getTrend = async (req, res) => {
    try {
        const { range } = req.query;
        const data = await analyticsService.getTrend(req.company.id, range);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getDepartments = async (req, res) => {
    try {
        const data = await analyticsService.getDepartments(req.company.id);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

export const getTimeToHire = async (req, res) => {
    try {
        const data = await analyticsService.getTimeToHire(req.company.id);
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        handleError(res, error);
    }
};
