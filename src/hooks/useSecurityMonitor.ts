import { useEffect, useState, useCallback } from "react";

interface SecurityEvent {
  type: "tab_hidden" | "tab_visible" | "fullscreen_exit" | "copy_attempt" | "paste_attempt";
  timestamp: Date;
}

interface UseSecurityMonitorOptions {
  onViolation?: (event: SecurityEvent) => void;
  maxViolations?: number;
  onMaxViolationsReached?: () => void;
}

export const useSecurityMonitor = (options: UseSecurityMonitorOptions = {}) => {
  const { onViolation, maxViolations = 3, onMaxViolationsReached } = options;
  const [violations, setViolations] = useState<SecurityEvent[]>([]);
  const [isActive, setIsActive] = useState(false);

  const addViolation = useCallback(
    (type: SecurityEvent["type"]) => {
      const event: SecurityEvent = { type, timestamp: new Date() };
      setViolations((prev) => {
        const newViolations = [...prev, event];
        if (newViolations.length >= maxViolations && onMaxViolationsReached) {
          onMaxViolationsReached();
        }
        return newViolations;
      });
      onViolation?.(event);
    },
    [maxViolations, onMaxViolationsReached, onViolation]
  );

  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation("tab_hidden");
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("copy_attempt");
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("paste_attempt");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addViolation("fullscreen_exit");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isActive, addViolation]);

  const startMonitoring = () => setIsActive(true);
  const stopMonitoring = () => setIsActive(false);
  const clearViolations = () => setViolations([]);

  return {
    violations,
    violationCount: violations.length,
    isActive,
    startMonitoring,
    stopMonitoring,
    clearViolations,
  };
};
