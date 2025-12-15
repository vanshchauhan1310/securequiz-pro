import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  PlusCircle,
  Trash2,
  GripVertical,
  Clock,
  Shield,
  Save,
  Eye,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { quizService } from "@/services/quizService";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [securityEnabled, setSecurityEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      timeLimit: 60,
    },
  ]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      timeLimit: 60,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o, i) => (i === optionIndex ? value : o)) }
          : q
      )
    );
  };

  const saveQuiz = async (status: 'draft' | 'active') => {
    if (!quizTitle) {
      toast.error("Please enter a quiz title");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Quiz
      const quiz = await quizService.createQuiz({
        title: quizTitle,
        description: quizDescription,
        time_limit: timeLimit * 60, // Convert to seconds
        status: status,
      });

      // 2. Create Questions
      await Promise.all(
        questions.map((q, index) =>
          quizService.addQuestion({
            quiz_id: quiz.id,
            question_text: q.question,
            options: q.options,
            correct_answer: q.correctAnswer,
            order: index + 1,
          })
        )
      );

      toast.success(`Quiz ${status === 'active' ? 'published' : 'saved'} successfully!`);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error("Failed to save quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => saveQuiz('draft');
  const handlePublish = () => saveQuiz('active');

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create New Quiz</h1>
              <p className="text-muted-foreground">Build your assessment step by step</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>
            <Button variant="hero" onClick={handlePublish} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Publish Quiz
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${step === s
                  ? "bg-primary text-primary-foreground"
                  : step > s
                    ? "bg-success/10 text-success"
                    : "bg-secondary text-muted-foreground"
                }`}
            >
              <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm font-semibold">
                {s}
              </span>
              <span className="hidden sm:inline font-medium">
                {s === 1 ? "Basic Info" : s === 2 ? "Questions" : "Settings"}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Quiz Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., JavaScript Fundamentals Assessment"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what this quiz covers..."
                      value={quizDescription}
                      onChange={(e) => setQuizDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="programming">Programming</SelectItem>
                          <SelectItem value="math">Mathematics</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="language">Language</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setStep(2)}>
                      Next: Add Questions
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Questions */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {questions.map((question, qIndex) => (
                <Card key={question.id}>
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <Badge variant="glow">Question {qIndex + 1}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(question.id)}
                      disabled={questions.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question</Label>
                      <Textarea
                        placeholder="Enter your question..."
                        value={question.question}
                        onChange={(e) =>
                          updateQuestion(question.id, "question", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label>Option {String.fromCharCode(65 + oIndex)}</Label>
                            {question.correctAnswer === oIndex && (
                              <Badge variant="success" className="text-[10px]">
                                Correct
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                              value={option}
                              onChange={(e) =>
                                updateOption(question.id, oIndex, e.target.value)
                              }
                            />
                            <Button
                              variant={
                                question.correctAnswer === oIndex ? "success" : "outline"
                              }
                              size="icon"
                              onClick={() =>
                                updateQuestion(question.id, "correctAnswer", oIndex)
                              }
                            >
                              ✓
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Label>Time per question:</Label>
                        <Input
                          type="number"
                          className="w-20"
                          value={question.timeLimit}
                          onChange={(e) =>
                            updateQuestion(question.id, "timeLimit", Number(e.target.value))
                          }
                        />
                        <span className="text-sm text-muted-foreground">seconds</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full" onClick={addQuestion}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Question
              </Button>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Next: Settings
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Settings */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security & Proctoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                    <div>
                      <h4 className="font-semibold">Tab Change Detection</h4>
                      <p className="text-sm text-muted-foreground">
                        Track when participants switch browser tabs
                      </p>
                    </div>
                    <Switch checked={securityEnabled} onCheckedChange={setSecurityEnabled} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                    <div>
                      <h4 className="font-semibold">Copy/Paste Prevention</h4>
                      <p className="text-sm text-muted-foreground">
                        Disable copy and paste during the quiz
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                    <div>
                      <h4 className="font-semibold">Fullscreen Mode</h4>
                      <p className="text-sm text-muted-foreground">
                        Require fullscreen during the quiz
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                    <div>
                      <h4 className="font-semibold">Auto-Submit on Violations</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically submit after 3 security violations
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="hero" onClick={handlePublish} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Publish Quiz
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default CreateQuiz;
