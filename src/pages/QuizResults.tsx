import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analyticsService";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Mail, Trophy, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { emailService } from "@/services/emailService";

const QuizResults = () => {
  const { user } = useAuth();
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>(
    {},
  );

  const { data: activities, isLoading } = useQuery({
    queryKey: ["all-activities", user?.id, user?.role],
    queryFn: () =>
      analyticsService.getAllActivities(
        user?.role === "admin" ? undefined : user?.id,
      ),
    enabled: !!user,
    select: (data) =>
      data.filter((activity) => activity.action === "completed"),
  });

  const handleSendResults = async (activity: any) => {
    if (!activity.email) {
      toast.error("No email address found for this user");
      return;
    }

    try {
      await emailService.sendResultsEmail(
        activity.email,
        activity.user,
        activity.quiz,
        activity.score,
        10, // Assuming total questions is not readily available in activity, might need to fetch or pass it
      );
      toast.success(`Results sent to ${activity.email}`);
    } catch (error) {
      toast.error("Failed to send email");
    }
  };

  const handleDownloadCSV = (quizTitle: string, quizActivities: any[]) => {
    const headers = ["Participant,Email,Score,Date"];
    const rows = quizActivities.map(
      (a) =>
        `"${a.user}","${a.email}","${a.score}%","${format(new Date(a.timestamp), "PPP")}"`,
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quizTitle}_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Group activities by quiz
  const groupedActivities =
    activities?.reduce((acc: Record<string, any[]>, activity) => {
      const quizTitle = activity.quiz;
      if (!acc[quizTitle]) {
        acc[quizTitle] = [];
      }
      acc[quizTitle].push(activity);
      return acc;
    }, {}) || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quiz Results</h1>
            <p className="text-muted-foreground">
              View results grouped by quiz
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : Object.keys(groupedActivities).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(
              ([quizTitle, quizActivities]) => {
                const searchQuery = searchQueries[quizTitle] || "";
                const filteredActivities = quizActivities.filter(
                  (a) =>
                    a.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    a.score.toString().includes(searchQuery),
                );

                return (
                  <Card key={quizTitle}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-xl">{quizTitle}</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="relative w-64">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search participant..."
                            value={searchQuery}
                            onChange={(e) =>
                              setSearchQueries((prev) => ({
                                ...prev,
                                [quizTitle]: e.target.value,
                              }))
                            }
                            className="pl-8"
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleDownloadCSV(quizTitle, filteredActivities)
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Participant</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredActivities.length > 0 ? (
                            filteredActivities.map((activity: any) => (
                              <TableRow key={activity.id}>
                                <TableCell>
                                  <div className="font-medium">
                                    {activity.user}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {activity.email}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Trophy
                                      className={`h-4 w-4 ${activity.score >= 70 ? "text-yellow-500" : "text-muted-foreground"}`}
                                    />
                                    <span className="font-bold">
                                      {activity.score}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {format(
                                    new Date(activity.timestamp),
                                    "MMM d, yyyy HH:mm",
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSendResults(activity)}
                                    title="Email Results"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center py-4 text-muted-foreground"
                              >
                                No matching results found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No quiz attempts found yet.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuizResults;
