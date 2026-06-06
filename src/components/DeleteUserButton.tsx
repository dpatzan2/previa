"use client";

import { Trash2 } from "lucide-react";
import { deleteUserAction } from "@/app/actions";

export function DeleteUserButton({
  userId,
  displayName,
  disabled = false,
}: {
  userId: string;
  displayName: string;
  disabled?: boolean;
}) {
  return (
    <form
      action={deleteUserAction}
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
      <button className="danger-button" type="submit" disabled={disabled} title="Eliminar usuario">
        <Trash2 size={16} />
        <span className="sr-only">Eliminar {displayName}</span>
      </button>
    </form>
  );
}
