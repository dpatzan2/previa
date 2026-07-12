import type { Match, MatchMarketResult, PredictionAnswer, RoomRuleSet } from "@prisma/client";
import { roomMarketCatalog, type RoomMarketKey } from "@/lib/room-presets";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function stringValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function valueEquals(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function inRange(total: number, range: string) {
  if (range.endsWith("+")) {
    return total >= Number(range.slice(0, -1));
  }

  const [minRaw, maxRaw] = range.split("-");
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
  return total >= min && total <= max;
}

function finalOutcome(homeScore: number, awayScore: number) {
  if (homeScore === awayScore) return "DRAW";
  return homeScore > awayScore ? "HOME" : "AWAY";
}

function doubleChanceWins(selection: string, outcome: string) {
  if (selection === "HOME_DRAW") return outcome === "HOME" || outcome === "DRAW";
  if (selection === "HOME_AWAY") return outcome === "HOME" || outcome === "AWAY";
  if (selection === "DRAW_AWAY") return outcome === "DRAW" || outcome === "AWAY";
  return false;
}

export function roomMarketPoints(ruleSet: Pick<RoomRuleSet, "customMarketConfig"> | null | undefined) {
  const config = asRecord(ruleSet?.customMarketConfig);
  const marketPoints = asRecord(config?.marketPoints);

  return Object.fromEntries(
    roomMarketCatalog.map((market) => {
      const configured = numberValue(marketPoints?.[market.key]);
      return [market.key, configured ?? market.defaultPoints];
    }),
  ) as Record<RoomMarketKey, number>;
}

export function scoreMarketAnswer({
  answer,
  match,
  result,
  pointsByMarket,
}: {
  answer: Pick<PredictionAnswer, "marketKey" | "value">;
  match: Pick<Match, "status" | "homeScore" | "awayScore">;
  result?: Pick<MatchMarketResult, "value"> | null;
  pointsByMarket: Record<RoomMarketKey, number>;
}) {
  if (match.status !== "FINISHED") return 0;

  const market = answer.marketKey as RoomMarketKey;
  const answerValue = asRecord(answer.value);
  if (!answerValue) return 0;

  const homeScore = match.homeScore;
  const awayScore = match.awayScore;
  const hasFinalScore = homeScore !== null && awayScore !== null;

  let isCorrect = false;

  if (market === "TOTAL_GOALS" && hasFinalScore) {
    isCorrect = inRange(homeScore + awayScore, stringValue(answerValue.value));
  } else if (market === "EXACT_TOTAL_GOALS" && hasFinalScore) {
    const total = numberValue(answerValue.value);
    isCorrect = total !== null && homeScore + awayScore === total;
  } else if (market === "OVER_UNDER_2_5" && hasFinalScore) {
    const total = homeScore + awayScore;
    const value = stringValue(answerValue.value);
    isCorrect =
      (value === "OVER_2_5" && total > 2.5) ||
      (value === "UNDER_2_5" && total < 2.5);
  } else if (market === "ODD_EVEN_TOTAL_GOALS" && hasFinalScore) {
    const total = homeScore + awayScore;
    const value = stringValue(answerValue.value);
    isCorrect = (value === "EVEN" && total % 2 === 0) || (value === "ODD" && total % 2 === 1);
  } else if (market === "BOTH_TEAMS_SCORE" && hasFinalScore) {
    isCorrect = stringValue(answerValue.value) === (homeScore > 0 && awayScore > 0 ? "YES" : "NO");
  } else if (market === "DOUBLE_CHANCE" && hasFinalScore) {
    isCorrect = doubleChanceWins(stringValue(answerValue.value), finalOutcome(homeScore, awayScore));
  } else if (market === "TEAM_TOTAL_GOALS" && hasFinalScore) {
    const side = stringValue(answerValue.side);
    const total = numberValue(answerValue.total);
    isCorrect =
      total !== null &&
      ((side === "HOME" && homeScore === total) || (side === "AWAY" && awayScore === total));
  } else if (market === "CLEAN_SHEET" && hasFinalScore) {
    const side = stringValue(answerValue.side);
    isCorrect =
      (side === "HOME" && awayScore === 0) ||
      (side === "AWAY" && homeScore === 0) ||
      (side === "NONE" && homeScore > 0 && awayScore > 0);
  } else if (market === "WIN_TO_NIL" && hasFinalScore) {
    const side = stringValue(answerValue.side);
    isCorrect =
      (side === "HOME" && homeScore > awayScore && awayScore === 0) ||
      (side === "AWAY" && awayScore > homeScore && homeScore === 0) ||
      (side === "NONE" && !(homeScore > awayScore && awayScore === 0) && !(awayScore > homeScore && homeScore === 0));
  } else if (market === "WIN_MARGIN" && hasFinalScore) {
    const margin = numberValue(answerValue.value);
    isCorrect = margin !== null && Math.abs(homeScore - awayScore) === margin;
  } else if (result) {
    isCorrect = valueEquals(answerValue, result.value);
  }

  return isCorrect ? pointsByMarket[market] ?? 0 : 0;
}
