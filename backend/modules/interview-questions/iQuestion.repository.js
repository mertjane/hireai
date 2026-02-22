import supabase from '../../config/db.js';

export const addQuestion = async (payload) => {
    const { data, error } = await supabase
        .from('interview_questions')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getByInterviewId = async (interview_id) => {
    const { data, error } = await supabase
        .from('interview_questions')
        .select('*, questions(*)')
        .eq('interview_id', interview_id)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};

export const getById = async (id) => {
    const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data;
};

export const updateById = async (id, updates) => {
    const { data, error } = await supabase
        .from('interview_questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteById = async (id) => {
    const { error } = await supabase
        .from('interview_questions')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
