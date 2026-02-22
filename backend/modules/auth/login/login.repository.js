import supabase from '../../../config/db.js';

export const getCompanyByEmail = async (email) => {
    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error) throw error;
    return data;
};
