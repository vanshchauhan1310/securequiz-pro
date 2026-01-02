import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { QuestionNavigator } from "@/components/quiz/QuestionNavigator";
import { TimerDisplay } from "@/components/quiz/TimerDisplay";
import { SecurityIndicator } from "@/components/quiz/SecurityIndicator";
import { useTimer } from "@/hooks/useTimer";
import { useSecurityMonitor } from "@/hooks/useSecurityMonitor";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { quizService } from "@/services/quizService";
import { Question } from "@/lib/supabase";
import { attemptService } from "@/services/attemptService";
import { supabase } from "@/lib/supabase";

const TakeQuiz = () => {
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get("id") || ""; // Get quiz ID from URL parameter
  const navigate = useNavigate();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number[]>>(new Map());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch quiz details
  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => quizService.getQuizById(quizId),
    enabled: !!quizId,
  });

  // Check if quiz is active
  useEffect(() => {
    if (quiz && quiz.status !== "active") {
      toast.error("This quiz is currently not active.");
      navigate("/");
    }
  }, [quiz, navigate]);

  // Fetch questions for the quiz
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["quiz-questions", quizId],
    queryFn: () => quizService.getQuizQuestions(quizId),
    enabled: !!quizId,
  });

  const isLoading = quizLoading || questionsLoading;

  const timer = useTimer({
    initialTime: quiz?.time_limit || 600, // Use quiz time limit or default to 10 minutes
    onTimeUp: () => {
      toast.error("Time's up! Your quiz has been automatically submitted.");
      handleSubmit();
    },
    autoStart: false,
  });

  const security = useSecurityMonitor({
    maxViolations: 3,
    onViolation: (event) => {
      if (event.type === "tab_hidden") {
        toast.warning("Tab switch detected!", {
          description: `Warning ${security.violationCount + 1}/3. Your activity is being monitored.`,
        });
      }
    },
    onMaxViolationsReached: () => {
      toast.error("Maximum violations reached. Quiz auto-submitted.");
      handleSubmit();
    },
  });

  const handleStartQuiz = async () => {
    if (!quizId || !questions || !user) return;

    // Request fullscreen immediately on user interaction
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen request failed", err);
      // Continue anyway, but maybe warn user
      toast.warning(
        "Could not enter fullscreen mode. Please enable it manually if required.",
      );
    }

    try {
      // Check if participant record exists for this user, if not create one
      // We can just use the user.id for linking in quiz_attempts

      // Create attempt
      // We need to update attemptService to accept user_id instead of participant_id or handle both
      // For now, let's assume we link to user_id in the new schema

      // Since attemptService expects participantId, let's fetch or create a participant record for this user
      let participantId = user.id; // Fallback

      // Try to find participant by email
      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("id")
        .eq("email", user.email)
        .single();

      if (existingParticipant) {
        participantId = existingParticipant.id;
      } else {
        // Create participant linked to user
        const { data: newParticipant, error: pError } = await supabase
          .from("participants")
          .insert([
            {
              name: user.email.split("@")[0],
              email: user.email,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (!pError && newParticipant) {
          participantId = newParticipant.id;
        }
      }

      const attempt = await attemptService.createAttempt(
        quizId,
        participantId,
        questions.length,
      );
      setAttemptId(attempt.id);

      // Log activity
      await attemptService.logActivity(
        user.email,
        "started",
        quiz?.title || "Quiz",
        quizId,
      );

      setQuizStarted(true);
      timer.start();
      security.startMonitoring();
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast.error("Failed to start quiz. Please try again.");
    }
  };

  const handleSelectAnswer = (answerIndex: number) => {
    const currentAnswers = answers.get(currentQuestion) || [];
    const newAnswers = currentAnswers.includes(answerIndex)
      ? currentAnswers.filter((a) => a !== answerIndex)
      : [...currentAnswers, answerIndex];

    setAnswers(
      new Map(
        answers.set(
          currentQuestion,
          newAnswers.sort((a, b) => a - b),
        ),
      ),
    );
  };

  const handleSubmit = async () => {
    if (!questions || !attemptId) return;

    timer.pause();
    security.stopMonitoring();
    setIsSubmitted(true);
    setShowResults(true);

    let correct = 0;
    console.log("Submitting quiz with attempt ID:", attemptId);
    const answerPromises: Promise<any>[] = [];

    answers.forEach((selectedAnswers, questionIndex) => {
      const question = questions[questionIndex];
      // Check if selected answers match correct answers exactly
      // Sort both arrays to ensure order doesn't matter
      const correctAnswers =
        question.correct_answers?.sort((a, b) => a - b) || [];
      const userAnswers = selectedAnswers.sort((a, b) => a - b);

      const isCorrect =
        correctAnswers.length === userAnswers.length &&
        correctAnswers.every((val, index) => val === userAnswers[index]);

      if (isCorrect) correct++;

      // Save answer
      answerPromises.push(
        attemptService.submitAnswer(
          attemptId,
          question.id,
          selectedAnswers, // Pass the array of selected answers
          isCorrect,
        ),
      );
    });
    console.log("Answer promises:", answerPromises);

    try {
      await Promise.all(answerPromises);
      await attemptService.completeAttempt(attemptId, correct);

      // Log completion
      await attemptService.logActivity(
        user?.email || "User",
        "completed",
        quiz?.title || "Quiz",
        quizId,
        Math.round((correct / questions.length) * 100),
      );

      toast.success("Quiz submitted successfully!");
      // Don't show score in toast description
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to save results.");
    }
  };

  const calculateScore = () => {
    if (!questions) return { correct: 0, total: 0, percentage: 0 };

    let correct = 0;
    answers.forEach((selectedAnswers, questionIndex) => {
      const question = questions[questionIndex];
      const correctAnswers =
        question.correct_answers?.sort((a, b) => a - b) || [];
      const userAnswers = selectedAnswers.sort((a, b) => a - b);

      const isCorrect =
        correctAnswers.length === userAnswers.length &&
        correctAnswers.every((val, index) => val === userAnswers[index]);

      if (isCorrect) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Error state - no quiz ID or quiz not found
  if (!quizId || !quiz || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card variant="glass" className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Quiz Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The quiz you're looking for doesn't exist or has no questions.
            </p>
            <Button variant="hero" asChild>
              <Link to="/">← Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizStarted) {
    const timeHours = Math.floor((quiz.time_limit || 600) / 3600);
    const timeMinutes = Math.floor(((quiz.time_limit || 600) % 3600) / 60);
    const timeSeconds = (quiz.time_limit || 600) % 60;

    const formattedTime =
      timeHours > 0
        ? `${timeHours.toString().padStart(2, "0")}:${timeMinutes
          .toString()
          .padStart(2, "0")}:${timeSeconds.toString().padStart(2, "0")}`
        : `${timeMinutes.toString().padStart(2, "0")}:${timeSeconds
          .toString()
          .padStart(2, "0")}`;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card variant="glass">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-primary-foreground">
                  Q
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
              <p className="text-muted-foreground mb-6">
                {quiz.description ||
                  `This quiz contains ${questions.length} questions.`}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="text-2xl font-bold text-primary">
                    {questions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="text-2xl font-bold text-primary">
                    {formattedTime}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Time Limit
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 rounded-xl bg-warning/10 border border-warning/30 mb-6">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                <p className="text-sm text-left">
                  Security monitoring is enabled. Avoid switching tabs or the
                  quiz may be auto-submitted.
                </p>
              </div>

              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={handleStartQuiz}
              >
                Start Quiz
              </Button>

              <Button variant="ghost" className="mt-4" asChild>
                <Link to="/">← Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card variant="glass">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Quiz Completed!</h2>
              <p className="text-muted-foreground mb-8">
                Thank you for attempting the quiz. Your responses have been
                recorded successfully.
              </p>

              <Button variant="hero" size="lg" asChild className="w-full">
                <Link to="/">Return to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  Q
                </span>
              </div>
              <span className="font-bold text-lg hidden sm:inline">
                {quiz?.title || "Quiz"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SecurityIndicator
              violationCount={security.violationCount}
              maxViolations={3}
              isActive={security.isActive}
            />
            <TimerDisplay
              timeLeft={timer.timeLeft}
              formattedTime={timer.formattedTime}
              percentage={timer.percentage}
              variant="compact"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8 container mx-auto px-4">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Area */}
          <div className="lg:col-span-3">
            <Card variant="glass" className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                <QuestionCard
                  key={currentQuestion}
                  questionNumber={currentQuestion + 1}
                  question={questions[currentQuestion]}
                  selectedAnswers={answers.get(currentQuestion) ?? []}
                  onSelectAnswer={handleSelectAnswer}
                />
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentQuestion((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentQuestion === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentQuestion === questions.length - 1 ? (
                  <Button
                    variant="hero"
                    onClick={handleSubmit}
                    disabled={answers.size < questions.length}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Quiz
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      setCurrentQuestion((prev) =>
                        Math.min(questions.length - 1, prev + 1),
                      )
                    }
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <QuestionNavigator
              totalQuestions={questions.length}
              currentQuestion={currentQuestion}
              answeredQuestions={new Set(answers.keys())}
              onNavigate={setCurrentQuestion}
            />

            <Card variant="glow" className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Progress
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(answers.size / questions.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {answers.size}/{questions.length}
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;
