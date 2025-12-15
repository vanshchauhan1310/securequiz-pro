import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quizService } from "@/services/quizService";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    FileQuestion,
    PlusCircle,
    Eye,
    MoreHorizontal,
    Loader2,
    ArrowLeft,
    Trash2,
    CheckCircle,
    XCircle,
} from "lucide-react";

const Quizzes = () => {
    const queryClient = useQueryClient();

    const { data: quizzes, isLoading } = useQuery({
        queryKey: ['all-quizzes'],
        queryFn: quizService.getQuizzesWithStats,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'active' | 'draft' }) =>
            quizService.updateQuiz(id, { status }),
        onSuccess: () => {
            toast.success("Quiz status updated");
            queryClient.invalidateQueries({ queryKey: ['all-quizzes'] });
        },
        onError: () => {
            toast.error("Failed to update status");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: quizService.deleteQuiz,
        onSuccess: () => {
            toast.success("Quiz deleted successfully");
            queryClient.invalidateQueries({ queryKey: ['all-quizzes'] });
        },
        onError: () => {
            toast.error("Failed to delete quiz");
        },
    });

    const handleStatusChange = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'draft' : 'active';
        updateStatusMutation.mutate({ id, status: newStatus });
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/dashboard">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">All Quizzes</h1>
                            <p className="text-muted-foreground">Manage and monitor all your quizzes.</p>
                        </div>
                    </div>
                    <Button variant="hero" asChild>
                        <Link to="/dashboard/create">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create New Quiz
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Quiz Library</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : quizzes && quizzes.length > 0 ? (
                            <div className="space-y-4">
                                {quizzes.map((quiz: any) => (
                                    <div
                                        key={quiz.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <FileQuestion className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-foreground">{quiz.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {quiz.quiz_attempts?.[0]?.count || 0} participants • Created {new Date(quiz.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant={
                                                    quiz.status === "active"
                                                        ? "success"
                                                        : quiz.status === "draft"
                                                            ? "secondary"
                                                            : "outline"
                                                }
                                            >
                                                {quiz.status}
                                            </Badge>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link to={`/quiz?id=${quiz.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(quiz.id, quiz.status)}>
                                                        {quiz.status === 'active' ? (
                                                            <>
                                                                <XCircle className="mr-2 h-4 w-4" />
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(quiz.id)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No quizzes found. Create your first quiz to get started!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Quizzes;
