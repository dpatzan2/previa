"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";
import { savePredictionsAction } from "@/app/actions";
import { FormFeedback, useActionFeedback } from "@/components/FormFeedback";
import { MatchPickCard } from "@/components/MatchPickCard";
import { PhaseTabs } from "@/components/PhaseTabs";
import { SubmitButton } from "@/components/SubmitButton";
import type { DisplayMatch, DisplayPrediction, PeerPrediction } from "@/lib/match-ui";
import { deadlinesByStage, type SerializedPhaseDeadline } from "@/lib/phase-deadlines";
import { stageLabels } from "@/lib/stages";
import type { MatchStage } from "@prisma/client";
import { useMemo, useState } from "react";

type PicksFormProps = {
  matches: DisplayMatch[];
  predictions: Record<string, DisplayPrediction>;
  peersByMatch: Record<string, PeerPrediction[]>;
  groupCodes: string[];
  stages: MatchStage[];
  phaseDeadlines: SerializedPhaseDeadline[];
};

export function PicksForm({
  matches,
  predictions,
  peersByMatch,
  groupCodes,
  stages,
  phaseDeadlines,
}: PicksFormProps) {
  const deadlineMap = deadlinesByStage(phaseDeadlines);
  const hasOpenPhases = useMemo(
    () => phaseDeadlines.some((item) => !item.locked),
    [phaseDeadlines],
  );
  const [activeStage, setActiveStage] = useState<MatchStage>(stages[0] ?? "GROUP");
  const activePhaseLocked = deadlineMap[activeStage]?.locked ?? false;
  const [saveState, saveAction, isSaving] = useActionState(savePredictionsAction, null);
  const feedback = useActionFeedback(saveState);

  return (
    <form action={saveAction} className="prediction-form">
      <PhaseTabs
        availableStages={stages}
        groupCodes={groupCodes}
        phaseDeadlines={deadlineMap}
        activeStage={activeStage}
        onActiveStageChange={setActiveStage}
      >
        {({ stage, groupCode }) => {
          const visibleMatches = matches.filter((match) => {
            if (match.stage !== stage) return false;
            if (stage === "GROUP") return match.groupCode === groupCode;
            return true;
          });
          const deadline = deadlineMap[stage];

          return (
            <section className="panel scoreboard-panel">
              <div className="panel-head">
                <h2>
                  {stage === "GROUP" && groupCode
                    ? `${stageLabels.GROUP} · Grupo ${groupCode}`
                    : stageLabels[stage]}
                </h2>
                <span>{visibleMatches.length} partidos</span>
              </div>

              {deadline ? (
                <div className={`phase-deadline${deadline.locked ? " closed" : ""}`}>
                  {deadline.locked ? (
                    <>
                      <strong>Fase cerrada · solo lectura</strong>
                      <span>
                        Ya no puedes modificar pronosticos de esta fase. El limite fue el{" "}
                        {deadline.deadlineLabel}.
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>Limite de pronosticos</strong>
                      <span>
                        Puedes editar hasta el {deadline.deadlineLabel} (hora Guatemala), un dia
                        antes del inicio el {deadline.startsLabel}.
                      </span>
                    </>
                  )}
                </div>
              ) : null}

              <div className="scoreboard-list">
                {matches.map((match) => {
                  const isVisible =
                    match.stage === stage && (stage !== "GROUP" || match.groupCode === groupCode);
                  const prediction = predictions[match.id];

                  return (
                    <MatchPickCard
                      key={match.id}
                      match={match}
                      prediction={prediction}
                      peers={peersByMatch[match.id] ?? []}
                      hidden={!isVisible}
                    />
                  );
                })}
              </div>
            </section>
          );
        }}
      </PhaseTabs>

      <div className="sticky-actions picks-actions">
        <FormFeedback feedback={feedback} />
        {!hasOpenPhases ? (
          <p className="picks-actions-note closed">Todos los pronosticos estan cerrados.</p>
        ) : activePhaseLocked ? (
          <p className="picks-actions-note">
            Esta fase ya esta cerrada. Cambia a una fase abierta para guardar cambios.
          </p>
        ) : null}
        <SubmitButton
          isPending={isSaving}
          pendingLabel="Guardando..."
          label={hasOpenPhases ? "Guardar pronosticos" : "Pronosticos cerrados"}
          disabled={!hasOpenPhases}
          icon={<Save size={18} />}
        />
      </div>
    </form>
  );
}
