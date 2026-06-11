import { CalendarClock } from "lucide-react";
import { TeamLabel } from "@/components/TeamLabel";
import { teamName, withGuatemalaSchedule } from "@/lib/match-ui";
import { stageLabels } from "@/lib/stages";
import type { Match, Team } from "@prisma/client";

type NextMatchMetricProps = {
  match:
    | (Pick<
        Match,
        | "matchNumber"
        | "stage"
        | "groupCode"
        | "dateLabel"
        | "timeLabel"
        | "kickoffAt"
        | "venue"
        | "venueShort"
        | "homePlaceholder"
        | "awayPlaceholder"
      > & {
        homeTeam: Team | null;
        awayTeam: Team | null;
      })
    | null;
};

export function NextMatchMetric({ match }: NextMatchMetricProps) {
  return (
    <article className="metric metric-next-match">
      <div className="metric-next-head">
        <span className="metric-next-icon">
          <CalendarClock size={20} />
        </span>
        <small>Siguiente partido</small>
      </div>

      {match ? (
        <>
          <div className="next-match-teams">
            <TeamLabel name={teamName(match.homeTeam, match.homePlaceholder, "Local")} compact />
            <span className="next-match-vs">vs</span>
            <TeamLabel name={teamName(match.awayTeam, match.awayPlaceholder, "Visitante")} compact />
          </div>

          <div className="next-match-meta">
            <span className="next-match-badge">P{match.matchNumber}</span>
            <span className="next-match-schedule">
              {formatSchedule(match)}
            </span>
            {match.stage === "GROUP" && match.groupCode ? (
              <span className="next-match-stage">
                {stageLabels.GROUP} · Grupo {match.groupCode}
              </span>
            ) : (
              <span className="next-match-stage">{stageLabels[match.stage]}</span>
            )}
            {match.venueShort ?? match.venue ? (
              <span className="next-match-venue">{match.venueShort ?? match.venue}</span>
            ) : null}
          </div>
        </>
      ) : (
        <div className="next-match-empty">
          <strong>Sin partidos pendientes</strong>
          <span>El fixture ya termino o aun no hay fechas.</span>
        </div>
      )}
    </article>
  );
}

function formatSchedule(
  match: Pick<Match, "dateLabel" | "timeLabel" | "kickoffAt">,
) {
  const schedule = withGuatemalaSchedule(match);
  if (schedule.dateLabel && schedule.timeLabel) {
    return `${schedule.dateLabel} · ${schedule.timeLabel} GT`;
  }
  return schedule.dateLabel ?? schedule.timeLabel ?? "Fecha por confirmar";
}
