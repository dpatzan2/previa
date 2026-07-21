"use client";

import { useRef } from "react";
import { Trash2 } from "lucide-react";
import { deleteRoomAction } from "@/app/actions";

export function DeleteRoomButton({
  roomId,
  roomName,
}: {
  roomId: string;
  roomName: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleClick = () => {
    const confirmed = window.confirm(
      `¿Eliminar la sala "${roomName}"? Se borrarán todos los miembros y pronósticos. Esta acción no se puede deshacer.`
    );
    if (confirmed) {
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form ref={formRef} action={deleteRoomAction}>
      <input type="hidden" name="roomId" value={roomId} />
      <button
        type="button"
        onClick={handleClick}
        className="danger-button"
      >
        <Trash2 size={15} />
        Eliminar sala
      </button>
    </form>
  );
}
