import supabase from '../../config/db.js';

export const createInterview = async (payload) => {
    const { data, error } = await supabase
        .from('interviews')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getInterviewsByCompany = async (company_id, { job_id, candidate_id } = {}) => {
    let query = supabase
        .from('interviews')
        .select('*')
        .eq('company_id', company_id);

    if (job_id) query = query.eq('job_id', job_id);
    if (candidate_id) query = query.eq('candidate_id', candidate_id);

    const { data, error } = await query.order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data;
};

export const getInterviewById = async (id, company_id) => {
    const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', id)
        .eq('company_id', company_id)
        .maybeSingle();

    if (error) throw error;
    return data;
};

export const getInterviewByToken = async (token) => {
    const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('token', token)
        .maybeSingle();

    if (error) throw error;
    return data;
};

export const updateInterview = async (id, company_id, updates) => {
    const { data, error } = await supabase
        .from('interviews')
        .update(updates)
        .eq('id', id)
        .eq('company_id', company_id)
        .select()
        .single();

    if (error) throw error;
    return data;
};
