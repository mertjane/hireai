import supabase from '../config/db.js';
import { randomUUID } from 'crypto';
import path from 'path';

const BUCKET = 'candidate-cvs';

export const uploadCV = async (file) => {
    const ext = path.extname(file.originalname) || '.pdf';
    const filePath = `cvs/${randomUUID()}${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });

    if (error) throw error;

    const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
};
