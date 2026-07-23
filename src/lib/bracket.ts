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
  /** La llave se jugo a ida y vuelta y el marcador mostrado es el global. */
  twoLegged?: boolean;
};

export type BracketPhase = {
  id: string;
  name: string;
  format: "GROUP" | "KNOCKOUT" | "LEAGUE";
  stage?: string | null;
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
  /** Ramas fuera del camino a la final: tercer puesto, play-in de perdedores, etc. */
  sides: { round: string; matches: BracketMatch[] }[];
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

/**
 * Los cruces sin equipos aun suelen venir descritos ("Ganador CF1"): el numero final
 * es la posicion de la llave dentro de la ronda anterior.
 */
function feederForPlaceholder(placeholder: string | null, previous: BracketMatch[], used: Set<string>) {
  if (!placeholder || !/ganador/i.test(placeholder)) return null;
  const index = Number(placeholder.match(/(\d+)\s*$/)?.[1]);
  const feeder = previous[index - 1];
  return feeder && !used.has(feeder.id) ? feeder : null;
}

function linkRound(current: BracketMatch[], previous: BracketMatch[]) {
  const used = new Set<string>();
  const bySlot = new Map<string, BracketMatch>();
  const slots = current.flatMap((match) => [
    { key: `${match.id}:H`, team: match.homeTeam, placeholder: match.homePlaceholder },
    { key: `${match.id}:A`, team: match.awayTeam, placeholder: match.awayPlaceholder },
  ]);

  // El equipo real manda sobre la descripcion, asi que se resuelve en dos pasadas.
  const resolvers = [
    (slot: (typeof slots)[number]) => feederForTeam(slot.team, previous, used),
    (slot: (typeof slots)[number]) => feederForPlaceholder(slot.placeholder, previous, used),
  ];
  for (const resolve of resolvers) {
    for (const slot of slots) {
      if (bySlot.has(slot.key)) continue;
      const feeder = resolve(slot);
      if (!feeder) continue;
      used.add(feeder.id);
      bySlot.set(slot.key, feeder);
    }
  }

  // ponytail: fallback secuencial para los cruces que no se pudieron resolver.
  // Reparte los alimentadores sobrantes en orden.
  const leftovers = previous.filter((match) => !used.has(match.id));
  const links = new Map<string, BracketMatch[]>();
  for (const match of current) {
    links.set(
      match.id,
      [`${match.id}:H`, `${match.id}:A`]
        .map((key) => bySlot.get(key) ?? leftovers.shift())
        .filter((feeder): feeder is BracketMatch => Boolean(feeder)),
    );
  }

  return links;
}

function slotKey(match: BracketMatch, side: "HOME" | "AWAY") {
  return side === "HOME"
    ? match.homeTeam?.id ?? match.homePlaceholder
    : match.awayTeam?.id ?? match.awayPlaceholder;
}

/** La vuelta es el mismo cruce con los locales invertidos. */
function isReturnLeg(first: BracketMatch, second: BracketMatch) {
  const home = slotKey(first, "HOME");
  const away = slotKey(first, "AWAY");
  if (!home || !away || home === away) return false;
  return home === slotKey(second, "AWAY") && away === slotKey(second, "HOME");
}

function addScores(a: number | null, b: number | null) {
  return a === null || b === null ? null : a + b;
}

function mergeLegs(first: BracketMatch, second: BracketMatch): BracketMatch {
  const live = first.status === "LIVE" || second.status === "LIVE";
  const finished = first.status === "FINISHED" && second.status === "FINISHED";
  return {
    ...first,
    status: live ? "LIVE" : finished ? "FINISHED" : "SCHEDULED",
    homeScore: addScores(first.homeScore, second.awayScore),
    awayScore: addScores(first.awayScore, second.homeScore),
    // El ganador de la llave se define en la vuelta, con los lados invertidos.
    actualWinnerSide: second.actualWinnerSide === "HOME" ? "AWAY" : second.actualWinnerSide === "AWAY" ? "HOME" : null,
    twoLegged: true,
  };
}

/** Convierte los partidos de una fase en llaves: la ida y la vuelta cuentan como una. */
function toTies(matches: BracketMatch[]): BracketMatch[] {
  const used = new Set<string>();
  const ties: BracketMatch[] = [];
  for (const first of matches) {
    if (used.has(first.id)) continue;
    used.add(first.id);
    const second = matches.find((other) => !used.has(other.id) && isReturnLeg(first, other));
    if (second) used.add(second.id);
    ties.push(second ? mergeLegs(first, second) : first);
  }
  return ties;
}

/**
 * Ramas que no llevan a la final. El tercer puesto viene marcado en la fase; el play-in
 * de perdedores solo se reconoce por como estan descritos sus cruces.
 */
function isSideBranch(phase: BracketPhase) {
  if (phase.stage === "THIRD_PLACE" || /tercer|3\.?er|consolaci/i.test(phase.name)) return true;
  return phase.matches.every(
    (match) => /^perdedor/i.test(match.homePlaceholder ?? "") && /^perdedor/i.test(match.awayPlaceholder ?? ""),
  );
}

export function buildBracket(phases: BracketPhase[]): Bracket | null {
  const knockout = phases
    .filter((phase) => phase.format === "KNOCKOUT" && phase.matches.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((phase) => ({ ...phase, matches: toTies([...phase.matches].sort(byMatchNumber)) }));

  const rounds = knockout.filter((phase) => !isSideBranch(phase));
  const finalPhase = rounds.at(-1);
  if (!finalPhase || finalPhase.matches.length !== 1) return null;

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
    final: toNode(finalPhase.matches[0]),
    sides: knockout
      .filter((phase) => isSideBranch(phase))
      .map((phase) => ({ round: phase.name, matches: phase.matches })),
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
