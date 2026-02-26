import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { firebase } from '../../../config/firebase.js';
import { handleDbError } from "../../../utils/error.util.js";
import { saveCompany } from "./register.repository.js";
import { hashPassword } from "../../../utils/password.util.js";

const auth = getAuth(firebase);
 
export const createCompany = async (companyData) => {
    try {
        const { email, password, name } = companyData;

        const hashedPassword = await hashPassword(password);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Save Profile in Supabase
        const dbPayload = {
            name,
            email,
            password_hash: hashedPassword,
            firebase_uuid: userCredential.user.uid
        };

        // 4. Pass the single object to the repository
        return await saveCompany(dbPayload);
    } catch (error) {
        // Map Firebase errors to readable messages
        throw handleDbError(error);
    }
};