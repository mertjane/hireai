import { createCompany } from './register.service.js';

export const handleRegister = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });

        const data = await createCompany(req.body);
        res.status(201).json(data);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};