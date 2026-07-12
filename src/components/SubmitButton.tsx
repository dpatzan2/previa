"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

type SubmitButtonProps = {
  // Legacy props (backward compatibility)
  isPending?: boolean;
  pendingLabel?: string;
  label?: string;
  icon?: ReactNode;

  // New props (form actions automatic state)
  className?: string;
  children?: ReactNode;
  pendingText?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
};

export function SubmitButton({
  isPending: propIsPending,
  pendingLabel,
  label,
  icon,
  className = "primary-button",
  children,
  pendingText = "Guardando...",
  disabled = false,
  style,
}: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();

  const isCurrentlyPending = propIsPending !== undefined ? propIsPending : formPending;
  const currentPendingLabel = pendingLabel !== undefined ? pendingLabel : pendingText;

  return (
    <button
      type="submit"
      className={className}
      disabled={disabled || isCurrentlyPending}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: (disabled || isCurrentlyPending) ? "not-allowed" : "pointer",
        opacity: (disabled || isCurrentlyPending) ? 0.75 : 1,
        ...style,
      }}
    >
      {isCurrentlyPending && <LoaderCircle size={18} className="spin-icon" />}
      {!isCurrentlyPending && icon}
      {isCurrentlyPending ? currentPendingLabel : (label || children)}
    </button>
  );
}
