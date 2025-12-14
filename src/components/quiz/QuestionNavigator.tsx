import { cn } from "@/lib/utils";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: Set<number>;
  onNavigate: (index: number) => void;
}

export const QuestionNavigator = ({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  onNavigate,
}: QuestionNavigatorProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        Questions
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            className={cn(
              "w-10 h-10 rounded-lg font-semibold text-sm transition-all",
              "border flex items-center justify-center",
              currentQuestion === i && "border-primary bg-primary text-primary-foreground",
              currentQuestion !== i && answeredQuestions.has(i) && "border-success bg-success/10 text-success",
              currentQuestion !== i && !answeredQuestions.has(i) && "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-success/10 border border-success" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-primary border border-primary" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-secondary/50 border border-border" />
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  );
};
