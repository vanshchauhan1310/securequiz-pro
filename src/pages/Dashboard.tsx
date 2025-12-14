import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  FileQuestion,
  Users,
  Clock,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Eye,
  MoreHorizontal,
} from "lucide-react";

const stats = [
  {
    title: "Total Quizzes",
    value: "24",
    change: "+3 this week",
    icon: FileQuestion,
    trend: "up",
  },
  {
    title: "Total Participants",
    value: "1,847",
    change: "+156 this month",
    icon: Users,
    trend: "up",
  },
  {
    title: "Avg. Completion Time",
    value: "18m 32s",
    change: "-2m from last week",
    icon: Clock,
    trend: "down",
  },
  {
    title: "Pass Rate",
    value: "78%",
    change: "+5% improvement",
    icon: TrendingUp,
    trend: "up",
  },
];

const recentQuizzes = [
  {
    id: 1,
    title: "JavaScript Fundamentals",
    participants: 234,
    avgScore: 82,
    status: "active",
    createdAt: "2 hours ago",
  },
  {
    id: 2,
    title: "React Advanced Concepts",
    participants: 156,
    avgScore: 76,
    status: "active",
    createdAt: "1 day ago",
  },
  {
    id: 3,
    title: "TypeScript Essentials",
    participants: 89,
    avgScore: 71,
    status: "draft",
    createdAt: "3 days ago",
  },
  {
    id: 4,
    title: "Node.js Backend Quiz",
    participants: 312,
    avgScore: 85,
    status: "completed",
    createdAt: "1 week ago",
  },
];

const recentActivity = [
  { user: "John Smith", action: "completed", quiz: "JavaScript Fundamentals", time: "2 min ago", score: 92 },
  { user: "Sarah Wilson", action: "started", quiz: "React Advanced Concepts", time: "5 min ago" },
  { user: "Mike Johnson", action: "completed", quiz: "JavaScript Fundamentals", time: "12 min ago", score: 78 },
  { user: "Emily Davis", action: "completed", quiz: "TypeScript Essentials", time: "25 min ago", score: 88 },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your quiz overview.</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/dashboard/create">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Quiz
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
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
                      <stat.icon className="h-5 w-5 text-primary" />
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
          ))}
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
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
