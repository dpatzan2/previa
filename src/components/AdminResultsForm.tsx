"use client";

import { Save } from "lucide-react";
import { saveResultsAction } from "@/app/actions";
import { AdminMatchScoreboard } from "@/components/AdminMatchScoreboard";
import { PhaseTabs } from "@/components/PhaseTabs";
import type { DisplayMatch, TeamOption } from "@/lib/match-ui";
import { stageLabels } from "@/lib/stages";
import type { MatchStage } from "@prisma/client";

type AdminResultsFormProps = {
  matches: DisplayMatch[];
  teams: TeamOption[];
  groupCodes: string[];
  stages: MatchStage[];
};

export function AdminResultsForm({ matches, teams, groupCodes, stages }: AdminResultsFormProps) {
  return (
    <form action={saveResultsAction} className="prediction-form">
      <PhaseTabs availableStages={stages} groupCodes={groupCodes}>
        {({ stage, groupCode }) => {
          const visibleMatches = matches.filter((match) => {
            if (match.stage !== stage) return false;
            if (stage === "GROUP") return match.groupCode === groupCode;
            return true;
          });

          return (
            <section className="panel scoreboard-panel">
              <div className="panel-head">
                <h2>
                  {stage === "GROUP" && groupCode
                    ? `${stageLabels.GROUP} · Grupo ${groupCode}`
                    : stageLabels[stage]}
                </h2>
                <span>{visibleMatches.length} partidos · Resultados oficiales</span>
              </div>
              <div className="scoreboard-list">
                {matches.map((match) => {
                  const isVisible =
                    match.stage === stage &&
                    (stage !== "GROUP" || match.groupCode === groupCode);

                  return (
                    <AdminMatchScoreboard
                      key={match.id}
                      match={match}
                      teams={teams}
                      hidden={!isVisible}
                    />
                  );
                })}
              </div>
            </section>
          );
        }}
      </PhaseTabs>

      <div className="sticky-actions">
        <button className="primary-button" type="submit">
          <Save size={18} />
          Guardar resultados
        </button>
      </div>
    </form>
  );
}
