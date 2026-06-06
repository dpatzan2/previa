"use client";

import { useState } from "react";
import {
  GroupMatchScoreboard,
  KnockoutMatchScoreboard,
} from "@/components/MatchScoreboard";
import { PhaseTabs } from "@/components/PhaseTabs";
import type { DisplayMatch, DisplayPrediction } from "@/lib/match-ui";
import { deadlinesByStage, type SerializedPhaseDeadline } from "@/lib/phase-deadlines";
import { stageLabels } from "@/lib/stages";
import type { MatchStage } from "@prisma/client";

type UserPredictionsViewProps = {
  matches: DisplayMatch[];
  predictions: Record<string, DisplayPrediction>;
  groupCodes: string[];
  stages: MatchStage[];
  phaseDeadlines: SerializedPhaseDeadline[];
};

export function UserPredictionsView({
  matches,
  predictions,
  groupCodes,
  stages,
  phaseDeadlines,
}: UserPredictionsViewProps) {
  const deadlineMap = deadlinesByStage(phaseDeadlines);
  const [activeStage, setActiveStage] = useState<MatchStage>(stages[0] ?? "GROUP");

  return (
    <div className="prediction-form">
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
                      <strong>Fase cerrada</strong>
                      <span>
                        El limite de pronosticos fue el {deadline.deadlineLabel}. La fase inicio el{" "}
                        {deadline.startsLabel}.
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>Limite de pronosticos</strong>
                      <span>
                        Hasta el {deadline.deadlineLabel} (hora Guatemala, un dia antes del inicio el{" "}
                        {deadline.startsLabel}).
                      </span>
                    </>
                  )}
                </div>
              ) : null}

              <div className="scoreboard-list">
                {matches.map((match) => {
                  const isVisible =
                    match.stage === stage &&
                    (stage !== "GROUP" || match.groupCode === groupCode);
                  const prediction = predictions[match.id];

                  return match.stage === "GROUP" ? (
                    <GroupMatchScoreboard
                      key={match.id}
                      match={match}
                      prediction={prediction}
                      hidden={!isVisible}
                      readOnly
                    />
                  ) : (
                    <KnockoutMatchScoreboard
                      key={match.id}
                      match={match}
                      prediction={prediction}
                      hidden={!isVisible}
                      readOnly
                    />
                  );
                })}
              </div>
            </section>
          );
        }}
      </PhaseTabs>
    </div>
  );
}
