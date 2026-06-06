import type { Match, Prediction } from "@prisma/client";
import type { ScoringRules } from "@/lib/scoring-settings";
import { defaultScoringRules } from "@/lib/scoring-settings";

function outcome(home: number, away: number) {
  if (home === away) return "DRAW";
  return home > away ? "HOME" : "AWAY";
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

    if (
      match.homeScore === prediction.predictedHomeScore &&
      match.awayScore === prediction.predictedAwayScore
    ) {
      return rules.groupExactPoints;
    }

    return outcome(match.homeScore, match.awayScore) ===
      outcome(prediction.predictedHomeScore, prediction.predictedAwayScore)
      ? rules.groupOutcomePoints
      : 0;
  }

  if (
    prediction.predictedWinnerTeamId &&
    match.actualWinnerTeamId &&
    prediction.predictedWinnerTeamId === match.actualWinnerTeamId
  ) {
    return rules.knockoutAdvancePoints;
  }

  if (
    prediction.predictedWinnerSide &&
    match.actualWinnerSide &&
    prediction.predictedWinnerSide === match.actualWinnerSide
  ) {
    return rules.knockoutAdvancePoints;
  }

  return 0;
}
