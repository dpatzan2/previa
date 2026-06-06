"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { ActionFeedbackState } from "@/lib/form-action-state";

export function FormFeedback({ feedback }: { feedback: ActionFeedbackState | null }) {
  if (!feedback) return null;

  return (
    <p
      className={`form-action-feedback${feedback.ok ? " success" : " error"}`}
      role="status"
      aria-live="polite"
    >
      {feedback.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {feedback.message}
    </p>
  );
}

export function useActionFeedback(actionState: ActionFeedbackState | null) {
  const [feedback, setFeedback] = useState<ActionFeedbackState | null>(null);

  useEffect(() => {
    if (!actionState) return;

    setFeedback(actionState);

    if (actionState.ok) {
      const timer = window.setTimeout(() => setFeedback(null), 4000);
      return () => window.clearTimeout(timer);
    }
  }, [actionState]);

  return feedback;
}
