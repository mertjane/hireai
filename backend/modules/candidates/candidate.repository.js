import supabase from '../../config/db.js';

export const createCandidate = async (payload) => {
    const { data, error } = await supabase
        .from('candidates')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getCandidatesByCompany = async (company_id, job_id) => {
    let query = supabase
        .from('candidates')
        .select('*')
        .eq('company_id', company_id);

    if (job_id) query = query.eq('job_id', job_id);

    const { data, error } = await query.order('applied_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const getCandidateById = async (id, company_id) => {
    const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .eq('company_id', company_id)
        .maybeSingle();

    if (error) throw error;
    return data;
};

export const updateCandidate = async (id, company_id, updates) => {
    const { data, error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)
        .eq('company_id', company_id)
        .select()
        .single();

    if (error) throw error;
    return data;
};
