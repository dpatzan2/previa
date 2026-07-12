"use client";

import { Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { savePredictionsAction, saveRoomPredictionsAction } from "@/app/actions";
import { FormFeedback, useActionFeedback } from "@/components/FormFeedback";
import { MatchPickCard } from "@/components/MatchPickCard";
import { PhaseTabs } from "@/components/PhaseTabs";
import { RoomMarketFields } from "@/components/RoomMarketFields";
import { SubmitButton } from "@/components/SubmitButton";
import type { DisplayMatch, DisplayPrediction, PeerPrediction } from "@/lib/match-ui";
import {
  canViewPeerPredictions,
  deadlinesByStage,
  firstEnterableStage,
  phaseDeadlineBanner,
  type PickDeadlineMode,
  type SerializedPhaseDeadline,
} from "@/lib/phase-deadlines";
import { stageLabels } from "@/lib/stages";
import type { MatchStage } from "@prisma/client";
import type { RoomMarketKey } from "@/lib/room-presets";

type MarketAnswerValue = Record<string, unknown>;

type PicksFormProps = {
  matches: DisplayMatch[];
  predictions: Record<string, DisplayPrediction>;
  peersByMatch: Record<string, PeerPrediction[]>;
  groupCodes: string[];
  stages: MatchStage[];
  phaseDeadlines: SerializedPhaseDeadline[];
  roomId?: string;
  roomMarkets?: RoomMarketKey[];
  marketAnswers?: Record<string, Partial<Record<RoomMarketKey, MarketAnswerValue>>>;
  deadlineMode?: PickDeadlineMode;
  deadlineHoursBefore?: number;
};

export function PicksForm({
  matches,
  predictions,
  peersByMatch,
  groupCodes,
  stages,
  phaseDeadlines,
  roomId,
  roomMarkets = [],
  marketAnswers = {},
  deadlineMode,
  deadlineHoursBefore,
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
  const saveHandler = roomId ? saveRoomPredictionsAction : savePredictionsAction;
  const [saveState, saveAction, isSaving] = useActionState(saveHandler, null);
  const feedback = useActionFeedback(saveState);

  return (
    <form action={saveAction} className="prediction-form">
      {roomId ? <input type="hidden" name="roomId" value={roomId} /> : null}
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
          const banner = deadline
            ? phaseDeadlineBanner(deadline, {
                editable: true,
                deadlineMode,
                deadlineHoursBefore,
              })
            : null;

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
                  const deadline = deadlineMap[match.stage];
                  const peerPicksVisible =
                    match.peerPicksVisible ?? canViewPeerPredictions(deadline);

                  return (
                    <div className={isVisible ? "match-pick-stack" : "match-pick-stack is-hidden"} key={match.id}>
                      <MatchPickCard
                        match={match}
                        prediction={prediction}
                        peers={peersByMatch[match.id] ?? []}
                        peerPicksVisible={peerPicksVisible}
                        phaseStartsLabel={deadline?.startsLabel}
                        hidden={!isVisible}
                      />
                      {isVisible && roomMarkets.length > 0 ? (
                        <details className="picks-market-details" style={{ marginTop: "12px", border: "1px dashed var(--line)", borderRadius: "6px", padding: "10px 14px", background: "var(--panel-soft)" }}>
                          <summary style={{ cursor: "pointer", fontWeight: "bold", fontSize: "0.88rem", color: "var(--primary)" }}>
                            Pronósticos de Bonus (Opcional)
                          </summary>
                          <div style={{ marginTop: "10px" }}>
                            <RoomMarketFields
                              match={match}
                              markets={roomMarkets}
                              answers={marketAnswers[match.id] ?? {}}
                            />
                          </div>
                        </details>
                      ) : null}
                    </div>
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
