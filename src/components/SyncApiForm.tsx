"use client";

import { useActionState } from "react";
import { syncWc2026Action } from "@/app/actions";
import { FormFeedback, useActionFeedback } from "@/components/FormFeedback";
import { SubmitButton } from "@/components/SubmitButton";

export function SyncApiForm() {
  const [state, action, isPending] = useActionState(syncWc2026Action, null);
  const feedback = useActionFeedback(state);

  return (
    <div className="sync-api-form">
      <FormFeedback feedback={feedback} />
      <form action={action}>
        <SubmitButton
          isPending={isPending}
          pendingLabel="Sincronizando..."
          label="Sincronizar API"
          className="ghost-button header-action"
        />
      </form>
    </div>
  );
}
