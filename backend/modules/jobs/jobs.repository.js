import supabase from '../../config/db.js';

export const createJob = async (payload) => {
    const { data, error } = await supabase
        .from('jobs')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getJobsByCompany = async (company_id) => {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const getAllJobs = async () => {
    const { data, error } = await supabase
        .from('jobs')
        .select('*, companies(id, name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const getJobById = async (id, company_id) => {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('company_id', company_id)
        .maybeSingle();

    if (error) throw error;
    return data;
};

export const getJobByIdPublic = async (id) => {
    const { data, error } = await supabase
        .from('jobs')
        .select('*, companies(id, name)')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data;
};

export const updateJob = async (id, company_id, updates) => {
    const { data, error } = await supabase
        .from('jobs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('company_id', company_id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteJob = async (id, company_id) => {
    const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id)
        .eq('company_id', company_id);

    if (error) throw error;
};
