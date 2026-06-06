"use client";

import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

type SubmitButtonProps = {
  isPending: boolean;
  pendingLabel: string;
  label: string;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
};

export function SubmitButton({
  isPending,
  pendingLabel,
  label,
  className = "primary-button",
  disabled = false,
  icon,
}: SubmitButtonProps) {
  return (
    <button className={className} type="submit" disabled={disabled || isPending}>
      {isPending ? <LoaderCircle size={18} className="spin-icon" /> : icon}
      {isPending ? pendingLabel : label}
    </button>
  );
}
