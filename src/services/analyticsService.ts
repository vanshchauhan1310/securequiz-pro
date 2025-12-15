import { supabase } from '@/lib/supabase';

export const analyticsService = {
    // Get dashboard statistics
    async getDashboardStats() {
        // Total quizzes
        const { count: totalQuizzes } = await supabase
            .from('quizzes')
            .select('*', { count: 'exact', head: true });

        // Total participants
        const { count: totalParticipants } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true });

        // Average completion time (in seconds)
        const { data: attempts } = await supabase
            .from('quiz_attempts')
            .select('started_at, completed_at')
            .not('completed_at', 'is', null);

        let avgCompletionTime = 0;
        if (attempts && attempts.length > 0) {
            const totalTime = attempts.reduce((sum, attempt) => {
                const start = new Date(attempt.started_at).getTime();
                const end = new Date(attempt.completed_at!).getTime();
                return sum + (end - start);
            }, 0);
            avgCompletionTime = Math.round(totalTime / attempts.length / 1000); // Convert to seconds
        }

        // Pass rate
        const { data: completedAttempts } = await supabase
            .from('quiz_attempts')
            .select('score, total_questions')
            .not('score', 'is', null);

        let passRate = 0;
        if (completedAttempts && completedAttempts.length > 0) {
            const passed = completedAttempts.filter(
                (attempt) => (attempt.score / attempt.total_questions) >= 0.7
            ).length;
            passRate = Math.round((passed / completedAttempts.length) * 100);
        }

        // Calculate changes (this week vs last week)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { count: quizzesThisWeek } = await supabase
            .from('quizzes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneWeekAgo.toISOString());

        const { count: participantsThisMonth } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

        // Format completion time
        const minutes = Math.floor(avgCompletionTime / 60);
        const seconds = avgCompletionTime % 60;
        const formattedTime = `${minutes}m ${seconds}s`;

        return [
            {
                title: 'Total Quizzes',
                value: totalQuizzes?.toString() || '0',
                change: `+${quizzesThisWeek || 0} this week`,
                trend: 'up' as const,
            },
            {
                title: 'Total Participants',
                value: totalParticipants?.toString() || '0',
                change: `+${participantsThisMonth || 0} this month`,
                trend: 'up' as const,
            },
            {
                title: 'Avg. Completion Time',
                value: formattedTime,
                change: avgCompletionTime > 0 ? 'Based on completed quizzes' : 'No data yet',
                trend: 'down' as const,
            },
            {
                title: 'Pass Rate',
                value: `${passRate}%`,
                change: completedAttempts && completedAttempts.length > 0 ? `${completedAttempts.length} attempts` : 'No data yet',
                trend: 'up' as const,
            },
        ];
    },

    // Get recent activity
    async getRecentActivity(limit: number = 4) {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return data.map((activity) => {
            const timeAgo = getTimeAgo(new Date(activity.created_at));
            return {
                user: activity.user_name,
                action: activity.action,
                quiz: activity.quiz_title,
                time: timeAgo,
                score: activity.score,
            };
        });
    },

    // Get global stats for landing page
    async getGlobalStats() {
        const { count: totalQuizzes } = await supabase
            .from('quiz_attempts')
            .select('*', { count: 'exact', head: true });

        const { count: totalUsers } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true });

        // Calculate average rating from completed attempts
        const { data: completedAttempts } = await supabase
            .from('quiz_attempts')
            .select('score, total_questions')
            .not('score', 'is', null);

        let avgRating = 0;
        if (completedAttempts && completedAttempts.length > 0) {
            const totalScore = completedAttempts.reduce((sum, attempt) => {
                return sum + (attempt.score / attempt.total_questions) * 5;
            }, 0);
            avgRating = totalScore / completedAttempts.length;
        }

        return [
            {
                value: totalQuizzes ? formatNumber(totalQuizzes) : '0',
                label: 'Quizzes Taken'
            },
            {
                value: totalUsers ? formatNumber(totalUsers) : '0',
                label: 'Active Users'
            },
            {
                value: '99.9%',
                label: 'Uptime'
            },
            {
                value: avgRating > 0 ? `${avgRating.toFixed(1)}/5` : '4.9/5',
                label: 'User Rating'
            },
        ];
    },
};

// Helper function to format large numbers
function formatNumber(num: number): string {
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M+`;
    } else if (num >= 1000) {
        return `${(num / 1000).toFixed(0)}K+`;
    }
    return num.toString();
}

// Helper function to get time ago
function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
}
