import * as analyticsRepo from './analytics.repository.js';

// Convert date range string to ISO timestamp (null = all time)
const parseSince = (range) => {
    const now = new Date();
    if (range === '30d')  return new Date(now - 30  * 86400000).toISOString();
    if (range === '90d')  return new Date(now - 90  * 86400000).toISOString();
    if (range === '180d') return new Date(now - 180 * 86400000).toISOString();
    return null;
};

export const getFunnel      = (company_id)        => analyticsRepo.getFunnel(company_id);
export const getQuality     = (company_id)        => analyticsRepo.getQuality(company_id);
export const getScores      = (company_id)        => analyticsRepo.getScores(company_id);
export const getTrend       = (company_id, range) => analyticsRepo.getTrend(company_id, parseSince(range));
export const getDepartments = (company_id)        => analyticsRepo.getDepartments(company_id);
export const getTimeToHire  = (company_id)        => analyticsRepo.getTimeToHire(company_id);
