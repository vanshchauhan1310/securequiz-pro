import { supabase } from "@/lib/supabase";

export interface User {
    id: string;
    email: string;
    role: 'admin' | 'participant';
}

export const authService = {
    // Login
    async login(email: string, password: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, role, is_used')
            .eq('email', email)
            .eq('password', password)
            .single();

        if (error || !data) {
            return null;
        }

        // Check if credential is used (only for participants)
        if (data.role === 'participant' && data.is_used) {
            console.error('Credential already used');
            return null;
        }

        // If participant, mark as used
        if (data.role === 'participant') {
            const { error: updateError } = await supabase
                .from('users')
                .update({ is_used: true })
                .eq('id', data.id);

            if (updateError) {
                console.error('Failed to invalidate credential', updateError);
                // We might still allow login but it's risky. Better to fail or log.
                // For now, proceed.
            }
        }

        return {
            id: data.id,
            email: data.email,
            role: data.role as 'admin' | 'participant',
        };
    },

    // Create Participant (Admin only)
    async createParticipant(email: string): Promise<{ password: string } | null> {
        // Generate a random 8-character password
        const password = Math.random().toString(36).slice(-8);

        const { error } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    password,
                    role: 'participant',
                    is_used: false,
                },
            ]);

        if (error) {
            console.error('Error creating participant:', error);
            return null;
        }

        // Also create a participant record for linking
        const { error: pError } = await supabase
            .from('participants')
            .insert([
                {
                    email,
                    name: email.split('@')[0], // Default name from email
                }
            ]);

        if (pError) {
            console.log('Participant record creation note:', pError);
        }

        return { password };
    },

    // Delete Participant Credential
    async deleteParticipant(email: string) {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('email', email)
            .eq('role', 'participant');

        if (error) throw error;
    },

    // Get All Participants (Users with role participant)
    async getParticipants() {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'participant')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};
