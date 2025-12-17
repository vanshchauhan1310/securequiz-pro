import { supabase, Quiz, Question } from '@/lib/supabase';

export const quizService = {
    // Get all quizzes
    async getAllQuizzes(userId?: string) {
        let query = supabase
            .from('quizzes')
            .select('*')
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('creator_id', userId);
        }

        const { data, error } = await query;

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
    async getQuizzesWithStats(userId?: string) {
        let query = supabase
            .from('quizzes')
            .select(`
        *,
        quiz_attempts(count)
      `)
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('creator_id', userId);
        }

        const { data, error } = await query;

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
            .insert([{
                ...question,
                correct_answers: question.correct_answers // Ensure this is passed correctly
            }])
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

    // Bulk create questions from CSV
    async createQuestionsBulk(quizId: string, file: File): Promise<Question[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                if (!text) return reject('Empty file');

                const lines = text.split('\n');
                const questions: Omit<Question, 'id' | 'created_at'>[] = [];

                // Skip header if present (assume header if first line has 'question' or 'Question')
                const startIdx = lines[0].toLowerCase().includes('question') ? 1 : 0;

                for (let i = startIdx; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Simple CSV split by comma, handling quotes is better but simple split for now
                    // Format: question, option1, option2, option3, option4, correct_answers (e.g. "A,C" or "1,3")
                    // Using a regex to split by comma but ignoring commas inside quotes would be better
                    // For simplicity, let's assume standard CSV without complex internal commas for now
                    const parts = line.split(',').map(p => p.trim());

                    if (parts.length < 6) continue; // Need at least question + 4 options + answer

                    const questionText = parts[0];
                    const options = parts.slice(1, parts.length - 1).filter(o => o); // Get options, remove empty
                    const answerStr = parts[parts.length - 1]; // Last part is answer

                    // Parse correct answers (A,B or 1,2)
                    const correctAnswers: number[] = [];
                    const answerParts = answerStr.split(/[|;&]/); // Split by common separators

                    answerParts.forEach(ans => {
                        const a = ans.trim().toUpperCase();
                        if (['A', 'B', 'C', 'D', 'E', 'F'].includes(a)) {
                            correctAnswers.push(a.charCodeAt(0) - 65);
                        } else if (!isNaN(Number(a))) {
                            // Assume 1-based index if number provided by user in CSV usually
                            correctAnswers.push(Number(a) - 1);
                        }
                    });

                    if (questionText && options.length > 0 && correctAnswers.length > 0) {
                        questions.push({
                            quiz_id: quizId,
                            question_text: questionText,
                            options: options,
                            correct_answers: correctAnswers,
                            order: i + 1
                        });
                    }
                }

                if (questions.length === 0) return reject('No valid questions found');

                try {
                    const { data, error } = await supabase
                        .from('questions')
                        .insert(questions)
                        .select();

                    if (error) throw error;
                    resolve(data as Question[]);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject('Failed to read file');
            reader.readAsText(file);
        });
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
    async getRecentQuizzes(limit: number = 4, userId?: string) {
        let query = supabase
            .from('quizzes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (userId) {
            query = query.eq('creator_id', userId);
        }

        const { data: quizzes, error } = await query;

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
