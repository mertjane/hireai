import supabase from '../../config/db.js';

export const getFunnel = async (company_id) => {
    const { data, error } = await supabase
        .from('v_hiring_funnel')
        .select('*')
        .eq('company_id', company_id)
        .maybeSingle();
    if (error) throw error;
    return data;
};

export const getQuality = async (company_id) => {
    const { data, error } = await supabase
        .from('v_interview_quality')
        .select('*')
        .eq('company_id', company_id)
        .maybeSingle();
    if (error) throw error;
    return data;
};

export const getScores = async (company_id) => {
    const { data, error } = await supabase
        .from('v_score_distribution')
        .select('*')
        .eq('company_id', company_id)
        .maybeSingle();
    if (error) throw error;
    return data;
};

export const getTrend = async (company_id, since) => {
    let query = supabase
        .from('v_weekly_applications')
        .select('*')
        .eq('company_id', company_id)
        .order('week_start', { ascending: true });

    if (since) query = query.gte('week_start', since);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
};

export const getDepartments = async (company_id) => {
    const { data, error } = await supabase
        .from('v_department_performance')
        .select('*')
        .eq('company_id', company_id)
        .order('total_candidates', { ascending: false });
    if (error) throw error;
    return data ?? [];
};

export const getTimeToHire = async (company_id) => {
    const { data, error } = await supabase
        .from('v_time_to_interview')
        .select('*')
        .eq('company_id', company_id)
        .maybeSingle();
    if (error) throw error;
    return data;
};
