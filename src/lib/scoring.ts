import type { Match, Prediction } from "@prisma/client";
import type { ScoringRules } from "@/lib/scoring-settings";
import { defaultScoringRules } from "@/lib/scoring-settings";

type BaseMarket = "EXACT_SCORE" | "MATCH_OUTCOME" | "ADVANCING_TEAM";

type Outcome = "HOME" | "AWAY" | "DRAW";

function matchOutcome(home: number, away: number): Outcome {
  if (home === away) return "DRAW";
  return home > away ? "HOME" : "AWAY";
}

function exactScore(
  match: Pick<Match, "homeScore" | "awayScore">,
  prediction: Pick<Prediction, "predictedHomeScore" | "predictedAwayScore">,
) {
  return (
    match.homeScore === prediction.predictedHomeScore &&
    match.awayScore === prediction.predictedAwayScore
  );
}

/** Acierta ganador local, visitante o empate aunque el marcador no sea exacto. */
function sameOutcome(
  match: Pick<Match, "homeScore" | "awayScore">,
  prediction: Pick<Prediction, "predictedHomeScore" | "predictedAwayScore">,
) {
  if (
    match.homeScore === null ||
    match.awayScore === null ||
    prediction.predictedHomeScore === null ||
    prediction.predictedAwayScore === null
  ) {
    return false;
  }

  return matchOutcome(match.homeScore, match.awayScore) ===
    matchOutcome(prediction.predictedHomeScore, prediction.predictedAwayScore);
}

function sameWinner(
  match: Pick<Match, "actualWinnerSide" | "actualWinnerTeamId">,
  prediction: Pick<Prediction, "predictedWinnerSide" | "predictedWinnerTeamId">,
) {
  if (
    prediction.predictedWinnerTeamId &&
    match.actualWinnerTeamId &&
    prediction.predictedWinnerTeamId === match.actualWinnerTeamId
  ) {
    return true;
  }

  return Boolean(
    prediction.predictedWinnerSide &&
      match.actualWinnerSide &&
      prediction.predictedWinnerSide === match.actualWinnerSide,
  );
}

export function scorePrediction(
  match: Pick<
    Match,
    | "stage"
    | "homeScore"
    | "awayScore"
    | "status"
    | "actualWinnerSide"
    | "actualWinnerTeamId"
  >,
  prediction: Pick<
    Prediction,
    | "predictedHomeScore"
    | "predictedAwayScore"
    | "predictedWinnerSide"
    | "predictedWinnerTeamId"
  >,
  rules: ScoringRules = defaultScoringRules,
  enabledMarkets: ReadonlySet<string> = new Set<BaseMarket>([
    "EXACT_SCORE",
    "MATCH_OUTCOME",
    "ADVANCING_TEAM",
  ]),
) {
  if (match.status !== "FINISHED") return 0;

  if (match.stage === "GROUP") {
    if (
      match.homeScore === null ||
      match.awayScore === null ||
      prediction.predictedHomeScore === null ||
      prediction.predictedAwayScore === null
    ) {
      return 0;
    }

    if (enabledMarkets.has("EXACT_SCORE") && exactScore(match, prediction)) {
      return rules.groupExactPoints;
    }

    if (enabledMarkets.has("MATCH_OUTCOME") && sameOutcome(match, prediction)) {
      return rules.groupOutcomePoints;
    }

    return 0;
  }

  if (
    match.homeScore !== null &&
    match.awayScore !== null &&
    prediction.predictedHomeScore !== null &&
    prediction.predictedAwayScore !== null &&
    enabledMarkets.has("EXACT_SCORE") &&
    exactScore(match, prediction)
  ) {
    return rules.groupExactPoints;
  }

  if (!enabledMarkets.has("ADVANCING_TEAM") || !sameWinner(match, prediction)) {
    return 0;
  }

  return rules.knockoutAdvancePoints;
}
