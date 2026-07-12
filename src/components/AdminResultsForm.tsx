"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";
import { saveResultsAction } from "@/app/actions";
import { AdminMatchScoreboard } from "@/components/AdminMatchScoreboard";
import { FormFeedback, useActionFeedback } from "@/components/FormFeedback";
import { PhaseTabs } from "@/components/PhaseTabs";
import { SubmitButton } from "@/components/SubmitButton";
import type { DisplayMatch, TeamOption } from "@/lib/match-ui";
import type { RoomMarketKey } from "@/lib/room-presets";
import { stageLabels } from "@/lib/stages";
import type { MatchStage } from "@prisma/client";

type MarketAnswerValue = Record<string, unknown>;

type AdminResultsFormProps = {
  matches: DisplayMatch[];
  teams: TeamOption[];
  groupCodes: string[];
  stages: MatchStage[];
  bonusMarkets: RoomMarketKey[];
  marketResults: Record<string, Partial<Record<RoomMarketKey, MarketAnswerValue>>>;
};

export function AdminResultsForm({
  matches,
  teams,
  groupCodes,
  stages,
  bonusMarkets,
  marketResults,
}: AdminResultsFormProps) {
  const [state, action, isPending] = useActionState(saveResultsAction, null);
  const feedback = useActionFeedback(state);

  return (
    <form action={action} className="prediction-form">
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
                      bonusMarkets={bonusMarkets}
                      marketResults={marketResults[match.id] ?? {}}
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
        <SubmitButton
          isPending={isPending}
          pendingLabel="Guardando..."
          label="Guardar resultados"
          icon={<Save size={18} />}
        />
      </div>
    </form>
  );
}
