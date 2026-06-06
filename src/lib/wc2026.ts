import { prisma } from "@/lib/db";

type ApiMatch = Record<string, unknown>;

function text(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" ? name : null;
  }
  return null;
}

function num(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return null;
}

function scoreFrom(match: ApiMatch, side: "home" | "away") {
  const score = match.score as Record<string, unknown> | undefined;
  const fullTime = score?.fullTime as Record<string, unknown> | undefined;
  const regular = score?.regularTime as Record<string, unknown> | undefined;
  return num(
    match[`${side}_score`],
    match[`${side}_goals`],
    score?.[side],
    fullTime?.[side],
    regular?.[side],
  );
}

function isFinished(value: unknown) {
  if (typeof value === "boolean") return value;
  const textValue = String(value ?? "").trim().toUpperCase();
  return ["TRUE", "FINISHED", "FT", "FT_PEN", "FULL_TIME"].includes(textValue);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

async function upsertTeam(name: string) {
  return prisma.team.upsert({
    where: { normalizedName: normalize(name) },
    update: { name },
    create: { name, normalizedName: normalize(name) },
  });
}

export async function syncWc2026Matches() {
  if ((process.env.WORLD_CUP_API_PROVIDER ?? "worldcup26ir") === "worldcup26ir") {
    return syncWorldcup26IrMatches();
  }

  const key = process.env.WC2026_API_KEY;
  if (!key) return { updated: 0, skipped: true };

  const response = await fetch("https://api.wc2026api.com/matches", {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`WC2026 API responded with ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const rows: ApiMatch[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown }).data)
      ? ((payload as { data: ApiMatch[] }).data)
      : [];

  let updated = 0;
  for (const row of rows) {
    const matchNumber = num(row.match_number, row.matchNumber, row.number);
    if (!matchNumber) continue;

    const homeName = text(row.home_team ?? row.homeTeam);
    const awayName = text(row.away_team ?? row.awayTeam);
    const homeScore = scoreFrom(row, "home");
    const awayScore = scoreFrom(row, "away");
    const winnerName = text(row.winner ?? row.winning_team ?? row.winner_team);
    const status = String(row.status ?? row.phase ?? "").toUpperCase();
    const finished = ["FINISHED", "FT", "FT_PEN", "FULL_TIME"].includes(status);

    const homeTeam = homeName ? await upsertTeam(homeName) : null;
    const awayTeam = awayName ? await upsertTeam(awayName) : null;
    let actualWinnerSide = null as "HOME" | "AWAY" | null;
    let actualWinnerTeamId = null as string | null;

    if (winnerName && homeName && normalize(winnerName) === normalize(homeName)) {
      actualWinnerSide = "HOME";
      actualWinnerTeamId = homeTeam?.id ?? null;
    } else if (winnerName && awayName && normalize(winnerName) === normalize(awayName)) {
      actualWinnerSide = "AWAY";
      actualWinnerTeamId = awayTeam?.id ?? null;
    } else if (homeScore !== null && awayScore !== null && homeScore !== awayScore) {
      actualWinnerSide = homeScore > awayScore ? "HOME" : "AWAY";
      actualWinnerTeamId = actualWinnerSide === "HOME" ? homeTeam?.id ?? null : awayTeam?.id ?? null;
    }

    await prisma.match.update({
      where: { matchNumber },
      data: {
        homeTeamId: homeTeam?.id,
        awayTeamId: awayTeam?.id,
        homeScore: finished ? homeScore : undefined,
        awayScore: finished ? awayScore : undefined,
        actualWinnerSide: actualWinnerSide ?? undefined,
        actualWinnerTeamId: actualWinnerTeamId ?? undefined,
        status: finished ? "FINISHED" : undefined,
      },
    });
    updated += 1;
  }

  return { updated, skipped: false };
}

async function syncWorldcup26IrMatches() {
  const baseUrl = process.env.WORLD_CUP_API_BASE_URL ?? "https://worldcup26.ir";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/get/games`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`worldcup26.ir responded with ${response.status}`);
  }

  const payload = (await response.json()) as { games?: ApiMatch[] };
  const rows = Array.isArray(payload.games) ? payload.games : [];
  let updated = 0;

  for (const row of rows) {
    const matchNumber = num(row.id, row.match_number, row.matchNumber);
    if (!matchNumber) continue;

    const finished = isFinished(row.finished);
    const homeScore = scoreFrom(row, "home");
    const awayScore = scoreFrom(row, "away");
    const homeLabel = text(row.home_team_name_en ?? row.home_team_label);
    const awayLabel = text(row.away_team_name_en ?? row.away_team_label);

    let actualWinnerSide = null as "HOME" | "AWAY" | null;
    if (finished && homeScore !== null && awayScore !== null && homeScore !== awayScore) {
      actualWinnerSide = homeScore > awayScore ? "HOME" : "AWAY";
    }

    await prisma.match.update({
      where: { matchNumber },
      data: {
        homePlaceholder: homeLabel ?? undefined,
        awayPlaceholder: awayLabel ?? undefined,
        homeScore: finished ? homeScore : undefined,
        awayScore: finished ? awayScore : undefined,
        actualWinnerSide: actualWinnerSide ?? undefined,
        status: finished ? "FINISHED" : undefined,
      },
    });
    updated += 1;
  }

  return { updated, skipped: false };
}
