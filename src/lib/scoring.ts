import type { Match, Prediction } from "@prisma/client";
import type { ScoringRules } from "@/lib/scoring-settings";
import { defaultScoringRules } from "@/lib/scoring-settings";

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

    if (exactScore(match, prediction)) {
      return rules.groupExactPoints;
    }

    if (sameOutcome(match, prediction)) {
      return rules.groupOutcomePoints;
    }

    return 0;
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
