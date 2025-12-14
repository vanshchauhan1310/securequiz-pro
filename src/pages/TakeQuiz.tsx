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
import { ArrowLeft, ArrowRight, Send, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const sampleQuestions = [
  {
    id: 1,
    question: "What is the correct syntax for referring to an external script called 'app.js'?",
    options: [
      "<script href='app.js'>",
      "<script name='app.js'>",
      "<script src='app.js'>",
      "<script file='app.js'>",
    ],
    correctAnswer: 2,
  },
  {
    id: 2,
    question: "How do you create a function in JavaScript?",
    options: [
      "function = myFunction()",
      "function myFunction()",
      "function:myFunction()",
      "create myFunction()",
    ],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: "How do you call a function named 'myFunction'?",
    options: [
      "call function myFunction()",
      "call myFunction()",
      "myFunction()",
      "execute myFunction()",
    ],
    correctAnswer: 2,
  },
  {
    id: 4,
    question: "Which operator is used to assign a value to a variable?",
    options: ["*", "-", "=", "x"],
    correctAnswer: 2,
  },
  {
    id: 5,
    question: "What will the following code return: Boolean(10 > 9)?",
    options: ["NaN", "false", "true", "undefined"],
    correctAnswer: 2,
  },
];

const TakeQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const timer = useTimer({
    initialTime: 600, // 10 minutes
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

  const handleStartQuiz = () => {
    setQuizStarted(true);
    timer.start();
    security.startMonitoring();
  };

  const handleSelectAnswer = (answerIndex: number) => {
    setAnswers(new Map(answers.set(currentQuestion, answerIndex)));
  };

  const handleSubmit = () => {
    timer.pause();
    security.stopMonitoring();
    setIsSubmitted(true);
    setShowResults(true);

    let correct = 0;
    answers.forEach((answer, questionIndex) => {
      if (sampleQuestions[questionIndex].correctAnswer === answer) {
        correct++;
      }
    });

    toast.success("Quiz submitted successfully!", {
      description: `You scored ${correct}/${sampleQuestions.length} (${Math.round(
        (correct / sampleQuestions.length) * 100
      )}%)`,
    });
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, questionIndex) => {
      if (sampleQuestions[questionIndex].correctAnswer === answer) {
        correct++;
      }
    });
    return { correct, total: sampleQuestions.length, percentage: Math.round((correct / sampleQuestions.length) * 100) };
  };

  if (!quizStarted) {
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
                <span className="text-3xl font-bold text-primary-foreground">Q</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">JavaScript Fundamentals</h1>
              <p className="text-muted-foreground mb-6">
                Test your knowledge of JavaScript basics. This quiz contains 5 questions and has a 10-minute time limit.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="text-2xl font-bold text-primary">5</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="text-2xl font-bold text-primary">10:00</div>
                  <div className="text-sm text-muted-foreground">Time Limit</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 rounded-xl bg-warning/10 border border-warning/30 mb-6">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                <p className="text-sm text-left">
                  Security monitoring is enabled. Avoid switching tabs or the quiz may be auto-submitted.
                </p>
              </div>

              <Button variant="hero" size="xl" className="w-full" onClick={handleStartQuiz}>
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
    const score = calculateScore();
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card variant="glass">
            <CardContent className="p-8 text-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  score.percentage >= 70 ? "bg-success/20" : "bg-destructive/20"
                }`}
              >
                <CheckCircle2
                  className={`h-10 w-10 ${
                    score.percentage >= 70 ? "text-success" : "text-destructive"
                  }`}
                />
              </div>
              <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
              <p className="text-muted-foreground mb-6">Here's how you performed</p>

              <div className="text-6xl font-bold text-gradient mb-2">{score.percentage}%</div>
              <p className="text-lg text-muted-foreground mb-6">
                {score.correct} out of {score.total} correct
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="text-xl font-bold text-foreground">{score.correct}</div>
                  <div className="text-xs text-muted-foreground">Correct</div>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="text-xl font-bold text-foreground">
                    {score.total - score.correct}
                  </div>
                  <div className="text-xs text-muted-foreground">Incorrect</div>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="text-xl font-bold text-foreground">
                    {security.violationCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Warnings</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/">Back to Home</Link>
                </Button>
                <Button variant="hero" className="flex-1" asChild>
                  <Link to="/dashboard">View Dashboard</Link>
                </Button>
              </div>
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
                <span className="text-primary-foreground font-bold text-sm">Q</span>
              </div>
              <span className="font-bold text-lg hidden sm:inline">JavaScript Quiz</span>
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
                  question={sampleQuestions[currentQuestion].question}
                  options={sampleQuestions[currentQuestion].options}
                  selectedAnswer={answers.get(currentQuestion) ?? null}
                  onSelectAnswer={handleSelectAnswer}
                />
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentQuestion === sampleQuestions.length - 1 ? (
                  <Button
                    variant="hero"
                    onClick={handleSubmit}
                    disabled={answers.size < sampleQuestions.length}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Quiz
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      setCurrentQuestion((prev) =>
                        Math.min(sampleQuestions.length - 1, prev + 1)
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
              totalQuestions={sampleQuestions.length}
              currentQuestion={currentQuestion}
              answeredQuestions={new Set(answers.keys())}
              onNavigate={setCurrentQuestion}
            />

            <Card variant="glow" className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Progress</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(answers.size / sampleQuestions.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {answers.size}/{sampleQuestions.length}
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
