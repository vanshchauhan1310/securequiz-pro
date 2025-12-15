import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analyticsService";
import { quizService } from "@/services/quizService";
import { authService } from "@/services/authService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  FileQuestion,
  Users,
  Clock,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Eye,
  MoreHorizontal,
  Loader2,
  UserPlus,
  Copy,
  Check,
} from "lucide-react";

const iconMap = {
  "Total Quizzes": FileQuestion,
  "Total Participants": Users,
  "Avg. Completion Time": Clock,
  "Pass Rate": TrendingUp,
};

const Dashboard = () => {
  const [isParticipantDialogOpen, setIsParticipantDialogOpen] = useState(false);
  const [participantEmail, setParticipantEmail] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [isCreatingParticipant, setIsCreatingParticipant] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsService.getDashboardStats,
  });

  // Fetch recent quizzes
  const { data: recentQuizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ['recent-quizzes'],
    queryFn: () => quizService.getRecentQuizzes(4),
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => analyticsService.getRecentActivity(4),
  });

  const handleCreateParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantEmail) return;

    setIsCreatingParticipant(true);
    try {
      const result = await authService.createParticipant(participantEmail);
      if (result) {
        setGeneratedPassword(result.password);
        toast.success("Participant created successfully!");
      } else {
        toast.error("Failed to create participant");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setIsCreatingParticipant(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(
        `Email: ${participantEmail}\nPassword: ${generatedPassword}`
      );
      setHasCopied(true);
      toast.success("Credentials copied to clipboard");
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const resetDialog = () => {
    setIsParticipantDialogOpen(false);
    setParticipantEmail("");
    setGeneratedPassword(null);
    setHasCopied(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your quiz overview.</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isParticipantDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setIsParticipantDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Participant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Participant Credentials</DialogTitle>
                  <DialogDescription>
                    Generate a one-time login for a participant.
                  </DialogDescription>
                </DialogHeader>

                {!generatedPassword ? (
                  <form onSubmit={handleCreateParticipant} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Participant Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="participant@example.com"
                        value={participantEmail}
                        onChange={(e) => setParticipantEmail(e.target.value)}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isCreatingParticipant}>
                        {isCreatingParticipant ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          "Generate Credentials"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <div className="font-medium">{participantEmail}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">One-Time Password</Label>
                        <div className="font-mono text-lg font-bold tracking-wider text-primary">
                          {generatedPassword}
                        </div>
                      </div>
                    </div>
                    <Button onClick={copyToClipboard} className="w-full" variant="secondary">
                      {hasCopied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Credentials
                        </>
                      )}
                    </Button>
                    <Button onClick={resetDialog} className="w-full">
                      Done
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button variant="hero" asChild>
              <Link to="/dashboard/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Quiz
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            stats?.map((stat, index) => {
              const Icon = iconMap[stat.title as keyof typeof iconMap] || FileQuestion;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="glow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <Badge
                          variant={stat.trend === "up" ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {stat.change}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.title}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Quizzes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Quizzes</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/quizzes">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {quizzesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : recentQuizzes && recentQuizzes.length > 0 ? (
                  <div className="space-y-4">
                    {recentQuizzes.map((quiz) => (
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
                              {quiz.participants} participants • Avg: {quiz.avgScore}%
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
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No quizzes yet. Create your first quiz to get started!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-foreground font-semibold text-xs">
                            {activity.user
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-semibold text-foreground">{activity.user}</span>{" "}
                            <span className="text-muted-foreground">{activity.action}</span>{" "}
                            <span className="font-medium text-foreground">{activity.quiz}</span>
                            {activity.score && (
                              <Badge variant="glow" className="ml-2 text-[10px]">
                                {activity.score}%
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
