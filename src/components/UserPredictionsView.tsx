"use client";

import { useState } from "react";
import {
  GroupMatchScoreboard,
  KnockoutMatchScoreboard,
} from "@/components/MatchScoreboard";
import { PhaseTabs } from "@/components/PhaseTabs";
import type { DisplayMatch, DisplayPrediction } from "@/lib/match-ui";
import {
  canViewPeerPredictions,
  deadlinesByStage,
  firstEnterableStage,
  phaseDeadlineBanner,
  phasePeerVisibilityBanner,
  type SerializedPhaseDeadline,
} from "@/lib/phase-deadlines";
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
  const [activeStage, setActiveStage] = useState<MatchStage>(() =>
    firstEnterableStage(stages, deadlineMap),
  );

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
          const banner = deadline ? phaseDeadlineBanner(deadline) : null;
          const peerBanner = deadline ? phasePeerVisibilityBanner(deadline) : null;
          const picksVisible = canViewPeerPredictions(deadline);

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

              {peerBanner ? (
                <div className="phase-deadline closed">
                  <strong>{peerBanner.title}</strong>
                  <span>{peerBanner.message}</span>
                </div>
              ) : null}

              {banner && picksVisible ? (
                <div className={`phase-deadline${banner.closed ? " closed" : ""}`}>
                  <strong>{banner.title}</strong>
                  <span>{banner.message}</span>
                </div>
              ) : null}

              <div className="scoreboard-list">
                {matches.map((match) => {
                  const isVisible =
                    match.stage === stage &&
                    (stage !== "GROUP" || match.groupCode === groupCode);
                  const prediction = picksVisible ? predictions[match.id] : undefined;

                  return match.stage === "GROUP" ? (
                    <GroupMatchScoreboard
                      key={match.id}
                      match={match}
                      prediction={prediction}
                      predictionHidden={!picksVisible}
                      hidden={!isVisible}
                      readOnly
                    />
                  ) : (
                    <KnockoutMatchScoreboard
                      key={match.id}
                      match={match}
                      prediction={prediction}
                      predictionHidden={!picksVisible}
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
