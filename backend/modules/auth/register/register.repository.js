import supabase from '../../../config/db.js';

export const saveCompany = async (dbPayload) => {
    const { data, error } = await supabase
        .from('companies')
        .insert([dbPayload])
        .select()
        .single(); 

    if (error) throw error;
    return data;
}; 