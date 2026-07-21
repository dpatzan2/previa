"use client";

import { Save, Trophy } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { savePredictionsAction, saveRoomPredictionsAction } from "@/app/actions";
import { FormFeedback, useActionFeedback } from "@/components/FormFeedback";
import { MatchPickCard } from "@/components/MatchPickCard";
import { PhaseTabs } from "@/components/PhaseTabs";
import { RoomMarketFields } from "@/components/RoomMarketFields";
import { SubmitButton } from "@/components/SubmitButton";
import { PredictionResultSummary } from "@/components/PredictionResultSummary";
import { PopularPredictions } from "@/components/PopularPredictions";
import type { DisplayMarketAnswer, DisplayMatch, DisplayPrediction, PeerPrediction, PopularPrediction } from "@/lib/match-ui";
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
import { bonusMarketsForStage, type RoomMarketKey } from "@/lib/room-presets";

type PicksFormProps = {
  matches: DisplayMatch[];
  predictions: Record<string, DisplayPrediction>;
  peersByMatch: Record<string, PeerPrediction[]>;
  groupCodes: string[];
  stages: MatchStage[];
  phaseDeadlines: SerializedPhaseDeadline[];
  roomId?: string;
  roomMarkets?: RoomMarketKey[];
  marketAnswers?: Record<string, Partial<Record<RoomMarketKey, DisplayMarketAnswer>>>;
  officialMarketResults?: Record<
    string,
    Partial<Record<RoomMarketKey, Record<string, unknown>>>
  >;
  deadlineMode?: PickDeadlineMode;
  deadlineHoursBefore?: number;
  popularPredictions?: Record<string, PopularPrediction>;
  competitionName?: string;
  championPick?: {
    enabled: boolean;
    locked: boolean;
    deadlineLabel: string | null;
    selectedTeamId: string | null;
    points: number;
    teams: Array<{ id: string; name: string }>;
  };
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
  officialMarketResults = {},
  deadlineMode,
  deadlineHoursBefore,
  popularPredictions = {},
  competitionName,
  championPick,
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
  const completedPicks = Object.values(predictions).filter(
    (prediction) =>
      prediction.predictedHomeScore !== null && prediction.predictedAwayScore !== null,
  ).length;

  return (
    <form action={saveAction} className="prediction-form">
      {roomId ? <input type="hidden" name="roomId" value={roomId} /> : null}
      <div className="picks-overview panel">
        <div>
          <span className="eyebrow">{competitionName ?? "Competencia"}</span>
          <strong>{completedPicks} de {matches.length} pronosticados</strong>
        </div>
        <progress value={completedPicks} max={Math.max(matches.length, 1)} />
      </div>

      {championPick?.enabled ? (
        <section className="champion-pick panel">
          <Trophy size={22} />
          <div>
            <span className="eyebrow">Candidato de la competicion</span>
            <strong>¿Quien sera campeon?</strong>
            <small>
              {championPick.deadlineLabel
                ? `Limite: ${championPick.deadlineLabel}`
                : "Sin fecha limite disponible"}
              {` · ${championPick.points} pts`}
            </small>
          </div>
          <select
            name="championTeamId"
            defaultValue={championPick.selectedTeamId ?? ""}
            disabled={championPick.locked}
            aria-label="Campeon de la competicion"
          >
            <option value="">Sin candidato</option>
            {championPick.teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </section>
      ) : null}
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
                  const visibleIndex = visibleMatches.findIndex((item) => item.id === match.id);
                  const showDateHeading =
                    isVisible &&
                    visibleIndex >= 0 &&
                    visibleMatches[visibleIndex - 1]?.dateLabel !== match.dateLabel;
                  const availableBonusMarkets = bonusMarketsForStage(roomMarkets, match.stage);
                  const hasBonusAnswers = Object.keys(marketAnswers[match.id] ?? {}).length > 0;

                  return (
                    <div className={isVisible ? "match-day-entry" : "match-day-entry is-hidden"} key={match.id}>
                      {showDateHeading ? <h3 className="match-day-heading">{match.dateLabel ?? "Fecha por definir"}</h3> : null}
                      <div className={isVisible ? "match-pick-stack" : "match-pick-stack is-hidden"}>
                      <MatchPickCard
                        match={match}
                        prediction={prediction}
                        peers={peersByMatch[match.id] ?? []}
                        peerPicksVisible={peerPicksVisible}
                        phaseStartsLabel={deadline?.startsLabel}
                        hidden={!isVisible}
                      />
                      {isVisible ? (
                        <PopularPredictions
                          match={match}
                          prediction={popularPredictions[match.id]}
                        />
                      ) : null}
                      {isVisible ? (
                        <PredictionResultSummary
                          match={match}
                          scorePoints={prediction?.points ?? 0}
                          predictedHomeScore={prediction?.predictedHomeScore ?? null}
                          predictedAwayScore={prediction?.predictedAwayScore ?? null}
                          answers={marketAnswers[match.id] ?? {}}
                          officialResults={officialMarketResults[match.id] ?? {}}
                        />
                      ) : null}
                      {isVisible && availableBonusMarkets.length > 0 ? (
                        <details className="picks-market-details" open={hasBonusAnswers || undefined}>
                          <summary>
                            <span>Bonus opcionales</span>
                            <small>{availableBonusMarkets.length} selecciones</small>
                          </summary>
                          <div className="picks-market-content">
                            <RoomMarketFields
                              match={match}
                              markets={availableBonusMarkets}
                              answers={Object.fromEntries(
                                Object.entries(marketAnswers[match.id] ?? {}).map(([key, answer]) => [
                                  key,
                                  answer?.value ?? {},
                                ]),
                              )}
                            />
                          </div>
                        </details>
                      ) : null}
                      </div>
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
