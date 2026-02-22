import supabase from '../../config/db.js';

export const createQuestion = async (payload) => {
    const { data, error } = await supabase
        .from('questions')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getQuestions = async (category) => {
    let query = supabase.from('questions').select('*');
    if (category) query = query.eq('category', category);

    const { data, error } = await query.order('category', { ascending: true });
    if (error) throw error;
    return data;
};

export const getQuestionById = async (id) => {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data;
};

export const updateQuestion = async (id, updates) => {
    const { data, error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteQuestion = async (id) => {
    const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
