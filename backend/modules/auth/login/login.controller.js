import { loginCompany } from './login.service.js';
import { HTTP_STATUS } from '../../../constants/statusCodes.js';

export const handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Email and password are required' });
        }

        const data = await loginCompany({ email, password });
        res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
        res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};
