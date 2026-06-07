"use client";

import { Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { savePredictionsAction } from "@/app/actions";
import { FormFeedback, useActionFeedback } from "@/components/FormFeedback";
import { MatchPickCard } from "@/components/MatchPickCard";
import { PhaseTabs } from "@/components/PhaseTabs";
import { SubmitButton } from "@/components/SubmitButton";
import type { DisplayMatch, DisplayPrediction, PeerPrediction } from "@/lib/match-ui";
import {
  deadlinesByStage,
  firstEnterableStage,
  phaseDeadlineBanner,
  type SerializedPhaseDeadline,
} from "@/lib/phase-deadlines";
import { stageLabels } from "@/lib/stages";
import type { MatchStage } from "@prisma/client";

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
  const [activeStage, setActiveStage] = useState<MatchStage>(
    () => firstEnterableStage(stages, deadlinesByStage(phaseDeadlines)),
  );
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
          const banner = deadline ? phaseDeadlineBanner(deadline, { editable: true }) : null;

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

              {banner ? (
                <div className={`phase-deadline${banner.closed ? " closed" : ""}`}>
                  <strong>{banner.title}</strong>
                  <span>{banner.message}</span>
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
            {deadlineMap[activeStage]?.sequentialLocked &&
            !deadlineMap[activeStage]?.deadlineLocked
              ? "Esta fase aun no abre. Cambia a una fase disponible para guardar cambios."
              : "Esta fase ya esta cerrada. Cambia a una fase abierta para guardar cambios."}
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
