"use client";

import { useRef } from "react";
import { Trash2 } from "lucide-react";
import { deleteCompetitionAction } from "@/app/actions";

export function DeleteCompetitionButton({
  competitionId,
  competitionName,
}: {
  competitionId: string;
  competitionName: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleClick = () => {
    const confirmed = window.confirm(
      `¿Eliminar "${competitionName}"? Se borrarán todas las fases, equipos y partidos asociados. Esta acción no se puede deshacer.`
    );
    if (confirmed) {
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form ref={formRef} action={deleteCompetitionAction}>
      <input type="hidden" name="id" value={competitionId} />
      <button
        type="button"
        onClick={handleClick}
        className="danger-button"
      >
        <Trash2 size={15} />
        Eliminar competencia
      </button>
    </form>
  );
}
