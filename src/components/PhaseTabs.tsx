"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import type { MatchStage } from "@prisma/client";
import type { SerializedPhaseDeadline } from "@/lib/phase-deadlines";
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
  const [internalStage, setInternalStage] = useState<MatchStage>(orderedStages[0] ?? "GROUP");
  const activeStage = controlledStage ?? internalStage;
  const [activeGroup, setActiveGroup] = useState<string>(groupCodes[0] ?? "A");

  const setActiveStage = (stage: MatchStage) => {
    if (onActiveStageChange) onActiveStageChange(stage);
    else setInternalStage(stage);
  };

  const activeGroupCode = activeStage === "GROUP" ? activeGroup : null;

  return (
    <div className="phase-tabs-root">
      <div className="phase-tabs" role="tablist" aria-label="Fases del torneo">
        {orderedStages.map((stage) => {
          const deadline = phaseDeadlines?.[stage];
          return (
            <button
              key={stage}
              type="button"
              role="tab"
              aria-selected={activeStage === stage}
              className={
                activeStage === stage
                  ? deadline?.locked
                    ? "phase-tab active locked"
                    : "phase-tab active"
                  : deadline?.locked
                    ? "phase-tab locked"
                    : "phase-tab"
              }
              onClick={() => setActiveStage(stage)}
            >
              <span className="phase-tab-label">
                {stageLabels[stage]}
                {deadline?.locked ? <Lock size={13} aria-hidden="true" /> : null}
              </span>
              {deadline ? (
                <small className="phase-tab-deadline">
                  {deadline.locked ? "Cerrada" : `Hasta ${deadline.deadlineLabel} GT`}
                </small>
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
