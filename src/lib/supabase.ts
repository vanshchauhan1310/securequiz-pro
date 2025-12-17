import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Quiz {
    id: string;
    title: string;
    description: string;
    time_limit: number; // in seconds
    status: 'draft' | 'active' | 'completed';
    created_at: string;
    updated_at: string;
    creator_id?: string;
}

export interface Question {
    id: string;
    quiz_id: string;
    question_text: string;
    options: string[];
    correct_answers: number[]; // Changed from correct_answer: number
    order: number;
    created_at: string;
}

export interface Participant {
    id: string;
    name: string;
    email: string;
    created_at: string;
}

export interface QuizAttempt {
    id: string;
    quiz_id: string;
    participant_id: string;
    started_at: string;
    completed_at?: string;
    score?: number;
    total_questions: number;
}

export interface Answer {
    id: string;
    attempt_id: string;
    question_id: string;
    selected_answers: number[]; // Changed from selected_answer: number
    is_correct: boolean;
    created_at: string;
}

export interface Activity {
    id: string;
    user: string;
    action: 'started' | 'completed';
    quiz: string;
    time: string;
    score?: number;
    created_at: string;
}
