import { supabase, QuizAttempt, Answer } from '@/lib/supabase';

export const attemptService = {
    // Create a new quiz attempt
    async createAttempt(quizId: string, participantId: string, totalQuestions: number) {
        const { data, error } = await supabase
            .from('quiz_attempts')
            .insert([{
                quiz_id: quizId,
                participant_id: participantId,
                total_questions: totalQuestions,
            }])
            .select()
            .single();

        if (error) throw error;
        return data as QuizAttempt;
    },

    // Submit an answer
    async submitAnswer(attemptId: string, questionId: string, selectedAnswer: number, isCorrect: boolean) {
        const { data, error } = await supabase
            .from('answers')
            .insert([{
                attempt_id: attemptId,
                question_id: questionId,
                selected_answer: selectedAnswer,
                is_correct: isCorrect,
            }])
            .select()
            .single();

        if (error) throw error;
        return data as Answer;
    },

    // Complete quiz attempt
    async completeAttempt(attemptId: string, score: number) {
        const { data, error } = await supabase
            .from('quiz_attempts')
            .update({
                completed_at: new Date().toISOString(),
                score,
            })
            .eq('id', attemptId)
            .select()
            .single();

        if (error) throw error;
        return data as QuizAttempt;
    },

    // Get attempt by ID
    async getAttemptById(attemptId: string) {
        const { data, error } = await supabase
            .from('quiz_attempts')
            .select('*')
            .eq('id', attemptId)
            .single();

        if (error) throw error;
        return data as QuizAttempt;
    },

    // Get answers for an attempt
    async getAttemptAnswers(attemptId: string) {
        const { data, error } = await supabase
            .from('answers')
            .select('*')
            .eq('attempt_id', attemptId);

        if (error) throw error;
        return data as Answer[];
    },

    // Log activity
    async logActivity(userName: string, action: 'started' | 'completed', quizTitle: string, quizId: string, score?: number) {
        const { error } = await supabase
            .from('activities')
            .insert([{
                user_name: userName,
                action,
                quiz_title: quizTitle,
                quiz_id: quizId,
                score,
            }]);

        if (error) throw error;
    },
};
