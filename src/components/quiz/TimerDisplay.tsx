import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  timeLeft: number;
  formattedTime: string;
  percentage: number;
  variant?: "default" | "compact" | "large";
  showWarning?: boolean;
  warningThreshold?: number;
}

export const TimerDisplay = ({
  timeLeft,
  formattedTime,
  percentage,
  variant = "default",
  showWarning = true,
  warningThreshold = 60,
}: TimerDisplayProps) => {
  const isWarning = showWarning && timeLeft <= warningThreshold && timeLeft > 0;
  const isCritical = timeLeft <= 30 && timeLeft > 0;

  const sizes = {
    compact: "text-lg",
    default: "text-2xl",
    large: "text-4xl",
  };

  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3",
        isWarning || isCritical
          ? "bg-destructive/10 border border-destructive/30"
          : "bg-secondary/50 border border-border"
      )}
      animate={isCritical ? { scale: [1, 1.02, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1 }}
    >
      {isWarning || isCritical ? (
        <AlertTriangle
          className={cn(
            "h-5 w-5",
            isCritical ? "text-destructive animate-pulse" : "text-warning"
          )}
        />
      ) : (
        <Clock className="h-5 w-5 text-primary" />
      )}
      <div className="flex flex-col">
        <span
          className={cn(
            "font-mono font-bold",
            sizes[variant],
            isCritical
              ? "text-destructive"
              : isWarning
              ? "text-warning"
              : "text-foreground"
          )}
        >
          {formattedTime}
        </span>
        {variant !== "compact" && (
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden mt-1">
            <motion.div
              className={cn(
                "h-full rounded-full",
                isCritical
                  ? "bg-destructive"
                  : isWarning
                  ? "bg-warning"
                  : "bg-primary"
              )}
              initial={{ width: "100%" }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
