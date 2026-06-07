"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import type { MatchStage } from "@prisma/client";
import {
  firstEnterableStage,
  isPhaseTabEnterable,
  phaseTabStatusLabel,
  type SerializedPhaseDeadline,
} from "@/lib/phase-deadlines";
import { stageLabels, stageOrder } from "@/lib/stages";

type PhaseTabsProps = {
  availableStages: MatchStage[];
  groupCodes: string[];
  phaseDeadlines?: Partial<Record<MatchStage, SerializedPhaseDeadline>>;
  activeStage?: MatchStage;
  onActiveStageChange?: (stage: MatchStage) => void;
  children: (active: { stage: MatchStage; groupCode: string | null }) => React.ReactNode;
};

export function PhaseTabs({
  availableStages,
  groupCodes,
  phaseDeadlines,
  activeStage: controlledStage,
  onActiveStageChange,
  children,
}: PhaseTabsProps) {
  const orderedStages = stageOrder.filter((stage) => availableStages.includes(stage));
  const defaultStage = firstEnterableStage(orderedStages, phaseDeadlines);
  const [internalStage, setInternalStage] = useState<MatchStage>(defaultStage);
  const activeStage = controlledStage ?? internalStage;
  const [activeGroup, setActiveGroup] = useState<string>(groupCodes[0] ?? "A");

  const setActiveStage = (stage: MatchStage) => {
    if (onActiveStageChange) onActiveStageChange(stage);
    else setInternalStage(stage);
  };

  useEffect(() => {
    if (isPhaseTabEnterable(phaseDeadlines?.[activeStage])) return;

    const fallback = firstEnterableStage(orderedStages, phaseDeadlines);
    if (fallback !== activeStage) {
      setActiveStage(fallback);
    }
  }, [activeStage, orderedStages, phaseDeadlines]);

  const activeGroupCode = activeStage === "GROUP" ? activeGroup : null;

  return (
    <div className="phase-tabs-root">
      <div className="phase-tabs" role="tablist" aria-label="Fases del torneo">
        {orderedStages.map((stage) => {
          const deadline = phaseDeadlines?.[stage];
          const isClosed = deadline?.deadlineLocked ?? false;
          const isUnavailable = !isPhaseTabEnterable(deadline);

          return (
            <button
              key={stage}
              type="button"
              role="tab"
              aria-selected={activeStage === stage}
              aria-disabled={isUnavailable}
              disabled={isUnavailable}
              className={
                activeStage === stage
                  ? deadline?.locked
                    ? isUnavailable
                      ? "phase-tab active unavailable"
                      : "phase-tab active locked"
                    : "phase-tab active"
                  : deadline?.locked
                    ? isUnavailable
                      ? "phase-tab unavailable"
                      : "phase-tab locked"
                    : "phase-tab"
              }
              onClick={() => {
                if (isUnavailable) return;
                setActiveStage(stage);
              }}
            >
              <span className="phase-tab-label">
                {stageLabels[stage]}
                {isClosed ? <Lock size={13} aria-hidden="true" /> : null}
              </span>
              {deadline ? (
                <small className="phase-tab-deadline">{phaseTabStatusLabel(deadline)}</small>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeStage === "GROUP" && groupCodes.length > 0 ? (
        <div className="group-tabs" role="tablist" aria-label="Grupos">
          {groupCodes.map((code) => (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={activeGroup === code}
              className={activeGroup === code ? "group-tab active" : "group-tab"}
              onClick={() => setActiveGroup(code)}
            >
              Grupo {code}
            </button>
          ))}
        </div>
      ) : null}

      <div className="phase-panel" role="tabpanel">
        {children({ stage: activeStage, groupCode: activeGroupCode })}
      </div>
    </div>
  );
}
