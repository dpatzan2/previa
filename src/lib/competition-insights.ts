export type FormResult = "W" | "D" | "L";

export type InsightTeam = {
  id: string;
  name: string;
  logoUrl: string | null;
};

export type InsightMatch = {
  id: string;
  kickoffAt: Date | null;
  status: "SCHEDULED" | "LIVE" | "FINISHED";
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: InsightTeam | null;
  awayTeam: InsightTeam | null;
};

export type StandingRow = {
  team: InsightTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: FormResult[];
  position: number;
  qualification: "AUTOMATIC" | "BEST_THIRD" | null;
};

function resultForTeam(match: InsightMatch, teamId: string): FormResult | null {
  if (match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) {
    return null;
  }
  const isHome = match.homeTeam?.id === teamId;
  const isAway = match.awayTeam?.id === teamId;
  if (!isHome && !isAway) return null;
  if (match.homeScore === match.awayScore) return "D";
  const teamWon = isHome ? match.homeScore > match.awayScore : match.awayScore > match.homeScore;
  return teamWon ? "W" : "L";
}

export function recentForm(matches: InsightMatch[], teamId: string, limit = 5): FormResult[] {
  return matches
    .filter((match) => match.homeTeam?.id === teamId || match.awayTeam?.id === teamId)
    .filter((match) => match.status === "FINISHED")
    .sort((left, right) => (left.kickoffAt?.getTime() ?? 0) - (right.kickoffAt?.getTime() ?? 0))
    .map((match) => resultForTeam(match, teamId))
    .filter((result): result is FormResult => result !== null)
    .slice(-limit);
}

export function calculateStandings(
  teams: InsightTeam[],
  matches: InsightMatch[],
  automaticQualifiers = 0,
): StandingRow[] {
  const rows = new Map<string, Omit<StandingRow, "position" | "qualification">>();
  for (const team of teams) {
    rows.set(team.id, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    });
  }

  for (const match of matches) {
    if (
      match.status !== "FINISHED" ||
      match.homeScore === null ||
      match.awayScore === null ||
      !match.homeTeam ||
      !match.awayTeam
    ) {
      continue;
    }
    const home = rows.get(match.homeTeam.id);
    const away = rows.get(match.awayTeam.id);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore === match.awayScore) {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    } else if (match.homeScore > match.awayScore) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
    } else {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
    }
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
      form: recentForm(matches, row.team.id),
    }))
    .sort(
      (left, right) =>
        right.points - left.points ||
        right.goalDifference - left.goalDifference ||
        right.goalsFor - left.goalsFor ||
        left.team.name.localeCompare(right.team.name, "es"),
    )
    .map((row, index) => ({
      ...row,
      position: index + 1,
      qualification: index < automaticQualifiers ? "AUTOMATIC" as const : null,
    }));
}

export function calculateBestThirds(
  groupTables: StandingRow[][],
  qualifierCount: number,
): StandingRow[] {
  return groupTables
    .map((table) => table[2])
    .filter((row): row is StandingRow => Boolean(row))
    .sort(
      (left, right) =>
        right.points - left.points ||
        right.goalDifference - left.goalDifference ||
        right.goalsFor - left.goalsFor ||
        left.team.name.localeCompare(right.team.name, "es"),
    )
    .map((row, index) => ({
      ...row,
      position: index + 1,
      qualification: index < qualifierCount ? "BEST_THIRD" as const : null,
    }));
}

export function popularOutcome(
  homeScore: number | null,
  awayScore: number | null,
): "HOME" | "DRAW" | "AWAY" | null {
  if (homeScore === null || awayScore === null) return null;
  if (homeScore === awayScore) return "DRAW";
  return homeScore > awayScore ? "HOME" : "AWAY";
}
