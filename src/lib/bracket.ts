export type BracketTeam = {
  id: string;
  name: string;
  logoUrl: string | null;
};

export type BracketMatch = {
  id: string;
  matchNumber: number | null;
  kickoffAt: Date | null;
  status: "SCHEDULED" | "LIVE" | "FINISHED";
  homeScore: number | null;
  awayScore: number | null;
  actualWinnerSide: "HOME" | "AWAY" | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  homeTeam: BracketTeam | null;
  awayTeam: BracketTeam | null;
};

export type BracketPhase = {
  id: string;
  name: string;
  format: "GROUP" | "KNOCKOUT" | "LEAGUE";
  sortOrder: number;
  matches: BracketMatch[];
};

export type BracketNode = {
  match: BracketMatch;
  round: string;
  feeders: BracketNode[];
};

export type Bracket = {
  rounds: string[];
  final: BracketNode;
  thirdPlace: { match: BracketMatch; round: string } | null;
};

function byMatchNumber(a: BracketMatch, b: BracketMatch) {
  return (a.matchNumber ?? 0) - (b.matchNumber ?? 0);
}

/**
 * Busca de que partido de la ronda anterior viene un equipo. Cuando el equipo aun no
 * esta asignado no hay nada que buscar y se resuelve con el emparejamiento secuencial.
 */
function feederForTeam(team: BracketTeam | null, previous: BracketMatch[], used: Set<string>) {
  if (!team) return null;
  return (
    previous.find(
      (match) => !used.has(match.id) && (match.homeTeam?.id === team.id || match.awayTeam?.id === team.id),
    ) ?? null
  );
}

function linkRound(current: BracketMatch[], previous: BracketMatch[]) {
  const used = new Set<string>();
  const links = new Map<string, BracketMatch[]>();

  for (const match of current) {
    const feeders: BracketMatch[] = [];
    for (const team of [match.homeTeam, match.awayTeam]) {
      const feeder = feederForTeam(team, previous, used);
      if (feeder) {
        used.add(feeder.id);
        feeders.push(feeder);
      }
    }
    links.set(match.id, feeders);
  }

  // ponytail: fallback secuencial para los partidos que no se pudieron resolver por
  // equipo (rondas futuras). Reparte los alimentadores sobrantes en orden.
  const leftovers = previous.filter((match) => !used.has(match.id));
  for (const match of current) {
    const feeders = links.get(match.id)!;
    while (feeders.length < 2 && leftovers.length > 0) {
      feeders.push(leftovers.shift()!);
    }
    feeders.sort(byMatchNumber);
  }

  return links;
}

export function buildBracket(phases: BracketPhase[]): Bracket | null {
  const knockout = phases
    .filter((phase) => phase.format === "KNOCKOUT" && phase.matches.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((phase) => ({ ...phase, matches: [...phase.matches].sort(byMatchNumber) }));

  const finalPhase = knockout.at(-1);
  if (!finalPhase || finalPhase.matches.length !== 1) return null;

  const thirdPlacePhase = knockout.slice(0, -1).find((phase) => phase.matches.length === 1);
  const rounds = knockout.filter((phase) => phase !== thirdPlacePhase);

  const links = new Map<string, BracketMatch[]>();
  for (let index = 1; index < rounds.length; index += 1) {
    for (const [matchId, feeders] of linkRound(rounds[index].matches, rounds[index - 1].matches)) {
      links.set(matchId, feeders);
    }
  }

  const roundNameByMatch = new Map<string, string>();
  for (const round of rounds) {
    for (const match of round.matches) roundNameByMatch.set(match.id, round.name);
  }

  const toNode = (match: BracketMatch): BracketNode => ({
    match,
    round: roundNameByMatch.get(match.id) ?? "",
    feeders: (links.get(match.id) ?? []).map(toNode),
  });

  return {
    rounds: rounds.map((round) => round.name),
    final: toNode(rounds.at(-1)!.matches[0]),
    thirdPlace: thirdPlacePhase
      ? { match: thirdPlacePhase.matches[0], round: thirdPlacePhase.name }
      : null,
  };
}

/** Aplana un subarbol en columnas por ronda, de la mas lejana a la final hacia la final. */
/** Ganador declarado por el admin; si no hay, se decide por marcador. */
export function winnerSide(match: BracketMatch): "HOME" | "AWAY" | null {
  if (match.actualWinnerSide) return match.actualWinnerSide;
  if (match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore === match.awayScore) return null;
  return match.homeScore > match.awayScore ? "HOME" : "AWAY";
}

export function flattenSide(node: BracketNode | undefined, depth: number): BracketMatch[][] {
  const columns: BracketMatch[][] = Array.from({ length: depth }, () => []);
  const walk = (current: BracketNode, level: number) => {
    if (level < 0) return;
    columns[level].push(current.match);
    for (const feeder of current.feeders) walk(feeder, level - 1);
  };
  if (node) walk(node, depth - 1);
  return columns;
}
