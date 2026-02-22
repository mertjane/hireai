import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebase } from '../../../config/firebase.js';
import { comparePassword } from '../../../utils/password.util.js';
import { createError } from '../../../utils/error.util.js';
import { getCompanyByEmail } from './login.repository.js';
import { HTTP_STATUS } from '../../../constants/statusCodes.js';

const auth = getAuth(firebase);

export const loginCompany = async ({ email, password }) => {
    const company = await getCompanyByEmail(email);

    if (!company) {
        throw createError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    const isPasswordValid = await comparePassword(password, company.password_hash);

    if (!isPasswordValid) {
        throw createError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    const { password_hash, ...profile } = company;

    return { profile, token };
};
