"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";
import { deleteUserAction } from "@/app/actions";
import { FormFeedback, useActionFeedback } from "@/components/FormFeedback";

export function DeleteUserButton({
  userId,
  displayName,
  disabled = false,
}: {
  userId: string;
  displayName: string;
  disabled?: boolean;
}) {
  const [state, action, isPending] = useActionState(deleteUserAction, null);
  const feedback = useActionFeedback(state);

  return (
    <div className="delete-user-action">
      <FormFeedback feedback={feedback} />
      <form
        action={action}
        onSubmit={(event) => {
          if (
            !confirm(
              `Eliminar a ${displayName}? Se borraran sus pronosticos y no se puede deshacer.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="userId" value={userId} />
        <button
          className="danger-button"
          type="submit"
          disabled={disabled || isPending}
          title="Eliminar usuario"
        >
          <Trash2 size={16} />
          <span className="sr-only">Eliminar {displayName}</span>
        </button>
      </form>
    </div>
  );
}
