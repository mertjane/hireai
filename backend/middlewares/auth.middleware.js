import admin from '../config/firebase.admin.js';
import supabase from '../config/db.js';
import { createError } from '../utils/error.util.js';
import { HTTP_STATUS } from '../constants/statusCodes.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            throw createError('Missing or invalid authorization header', HTTP_STATUS.UNAUTHORIZED);
        }

        const token = authHeader.split(' ')[1];
        const decoded = await admin.auth().verifyIdToken(token);

        const { data: company, error } = await supabase
            .from('companies')
            .select('*')
            .eq('firebase_uuid', decoded.uid)
            .maybeSingle();

        if (error) throw error;
        if (!company) throw createError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);

        req.company = company;
        next();
    } catch (error) {
        res.status(error.status || HTTP_STATUS.UNAUTHORIZED).json({ error: error.message });
    }
};
