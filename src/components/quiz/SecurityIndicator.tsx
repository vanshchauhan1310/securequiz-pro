import { motion } from "framer-motion";
import { Shield, ShieldAlert, ShieldX, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SecurityIndicatorProps {
  violationCount: number;
  maxViolations: number;
  isActive: boolean;
}

export const SecurityIndicator = ({
  violationCount,
  maxViolations,
  isActive,
}: SecurityIndicatorProps) => {
  const getStatus = () => {
    if (!isActive) return "inactive";
    if (violationCount === 0) return "secure";
    if (violationCount < maxViolations) return "warning";
    return "danger";
  };

  const status = getStatus();

  const statusConfig = {
    inactive: {
      icon: Shield,
      color: "text-muted-foreground",
      bg: "bg-muted",
      label: "Monitoring Off",
    },
    secure: {
      icon: Shield,
      color: "text-success",
      bg: "bg-success/10",
      label: "Secure",
    },
    warning: {
      icon: ShieldAlert,
      color: "text-warning",
      bg: "bg-warning/10",
      label: `${violationCount}/${maxViolations} Warnings`,
    },
    danger: {
      icon: ShieldX,
      color: "text-destructive",
      bg: "bg-destructive/10",
      label: "Max Violations",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-3 border",
        config.bg,
        status === "warning" || status === "danger"
          ? "border-current/30"
          : "border-border"
      )}
      animate={
        status === "warning" || status === "danger"
          ? { opacity: [1, 0.7, 1] }
          : {}
      }
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <Icon className={cn("h-5 w-5", config.color)} />
      <div className="flex flex-col">
        <span className={cn("font-semibold text-sm", config.color)}>
          {config.label}
        </span>
        {isActive && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>Proctoring Active</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
