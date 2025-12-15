import { supabase, Quiz, Question } from '@/lib/supabase';

export const quizService = {
    // Get all quizzes
    async getAllQuizzes() {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Quiz[];
    },

    // Get quiz by ID
    async getQuizById(id: string) {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Quiz;
    },

    // Get quizzes with participant count
    async getQuizzesWithStats() {
        const { data, error } = await supabase
            .from('quizzes')
            .select(`
        *,
        quiz_attempts(count)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Create new quiz
    async createQuiz(quiz: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('quizzes')
            .insert([quiz])
            .select()
            .single();

        if (error) throw error;
        return data as Quiz;
    },

    // Update quiz
    async updateQuiz(id: string, updates: Partial<Quiz>) {
        const { data, error } = await supabase
            .from('quizzes')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Quiz;
    },

    // Delete quiz
    async deleteQuiz(id: string) {
        const { error } = await supabase
            .from('quizzes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Get questions for a quiz
    async getQuizQuestions(quizId: string) {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('quiz_id', quizId)
            .order('order', { ascending: true });

        if (error) throw error;
        return data as Question[];
    },

    // Add question to quiz
    async addQuestion(question: Omit<Question, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('questions')
            .insert([question])
            .select()
            .single();

        if (error) throw error;
        return data as Question;
    },

    // Update question
    async updateQuestion(id: string, updates: Partial<Question>) {
        const { data, error } = await supabase
            .from('questions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Question;
    },

    // Delete question
    async deleteQuestion(id: string) {
        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Get recent quizzes with stats
    async getRecentQuizzes(limit: number = 4) {
        const { data: quizzes, error } = await supabase
            .from('quizzes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Get stats for each quiz
        const quizzesWithStats = await Promise.all(
            quizzes.map(async (quiz) => {
                // Get participant count
                const { count: participantCount } = await supabase
                    .from('quiz_attempts')
                    .select('*', { count: 'exact', head: true })
                    .eq('quiz_id', quiz.id);

                // Get average score
                const { data: attempts } = await supabase
                    .from('quiz_attempts')
                    .select('score')
                    .eq('quiz_id', quiz.id)
                    .not('score', 'is', null);

                const avgScore = attempts && attempts.length > 0
                    ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
                    : 0;

                return {
                    id: quiz.id,
                    title: quiz.title,
                    participants: participantCount || 0,
                    avgScore,
                    status: quiz.status,
                    createdAt: new Date(quiz.created_at).toLocaleString(),
                };
            })
        );

        return quizzesWithStats;
    },

    // Get featured quiz (first active quiz)
    async getFeaturedQuiz() {
        const { data, error } = await supabase
            .from('quizzes')
            .select('id')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
        return data;
    },
};
