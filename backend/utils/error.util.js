import { HTTP_STATUS, DB_ERRORS } from '../constants/statusCodes.js';

export const handleError = (res, error) =>
    res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message });

export const createError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

export const handleDbError = (error) => {
    const err = new Error(error.message);

    if (error.code === DB_ERRORS.DUPLICATE_KEY) {
        err.status = HTTP_STATUS.CONFLICT;
    } else {
        err.status = HTTP_STATUS.BAD_REQUEST;
    }

    throw err;
};