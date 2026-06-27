import type { MatchStage } from "@prisma/client";

import { matchScheduleLabels } from "@/lib/timezone";

export type DisplayMatch = {
  id: string;
  matchNumber: number;
  stage: MatchStage;
  groupCode: string | null;
  dateLabel: string | null;
  timeLabel: string | null;
  venue: string | null;
  venueShort: string | null;
  locked: boolean;
  peerPicksVisible?: boolean;
  pickDeadlineLabel?: string | null;
  home: string;
  away: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  actualWinnerSide: "HOME" | "AWAY" | null;
};

export type DisplayPrediction = {
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  predictedWinnerSide: "HOME" | "AWAY" | null;
  points: number;
};

export type PeerPrediction = {
  userId: string;
  displayName: string;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  predictedWinnerSide: "HOME" | "AWAY" | null;
  pickedTeamName: string | null;
  points: number;
};

export type TeamOption = {
  id: string;
  name: string;
};

export function teamName(
  team: { name: string } | null | undefined,
  placeholder: string | null | undefined,
  fallback: string,
) {
  return team?.name ?? placeholder ?? fallback;
}

export function withGuatemalaSchedule<
  T extends {
    dateLabel: string | null;
    timeLabel: string | null;
    kickoffAt?: Date | null;
  },
>(match: T) {
  const schedule = matchScheduleLabels(
    match.kickoffAt ?? null,
    match.dateLabel,
    match.timeLabel,
  );
  return { ...match, ...schedule };
}
