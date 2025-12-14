import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  questionNumber: number;
  question: string;
  options: string[];
  selectedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  showResult?: boolean;
  correctAnswer?: number;
}

export const QuestionCard = ({
  questionNumber,
  question,
  options,
  selectedAnswer,
  onSelectAnswer,
  showResult = false,
  correctAnswer,
}: QuestionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <div className="mb-6">
        <span className="text-primary font-semibold text-sm">
          Question {questionNumber}
        </span>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mt-2">
          {question}
        </h2>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = showResult && correctAnswer === index;
          const isWrong = showResult && isSelected && correctAnswer !== index;

          return (
            <motion.button
              key={index}
              onClick={() => !showResult && onSelectAnswer(index)}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-all duration-200",
                "flex items-center gap-4",
                !showResult && "hover:border-primary/50 hover:bg-secondary/50",
                isSelected && !showResult && "border-primary bg-primary/10",
                isCorrect && "border-success bg-success/10",
                isWrong && "border-destructive bg-destructive/10",
                !isSelected && !isCorrect && !isWrong && "border-border bg-secondary/30"
              )}
              whileHover={!showResult ? { scale: 1.01 } : {}}
              whileTap={!showResult ? { scale: 0.99 } : {}}
              disabled={showResult}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                  "border-2 transition-all",
                  isSelected && !showResult && "border-primary bg-primary text-primary-foreground",
                  isCorrect && "border-success bg-success text-success-foreground",
                  isWrong && "border-destructive bg-destructive text-destructive-foreground",
                  !isSelected && !isCorrect && !isWrong && "border-border text-muted-foreground"
                )}
              >
                {isCorrect || (isSelected && !showResult) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </div>
              <span
                className={cn(
                  "flex-1 font-medium",
                  isCorrect && "text-success",
                  isWrong && "text-destructive"
                )}
              >
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
