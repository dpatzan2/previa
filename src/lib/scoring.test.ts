import assert from "node:assert/strict";
import test from "node:test";
import { scoreEnabledMarketAnswer, scoreMarketAnswer } from "@/lib/market-scoring";
import { scorePrediction } from "@/lib/scoring";

const groupMatch: Parameters<typeof scorePrediction>[0] = {
  stage: "GROUP",
  status: "FINISHED",
  homeScore: 2,
  awayScore: 1,
  actualWinnerSide: "HOME",
  actualWinnerTeamId: null,
};

const exactPrediction: Parameters<typeof scorePrediction>[1] = {
  predictedHomeScore: 2,
  predictedAwayScore: 1,
  predictedWinnerSide: null,
  predictedWinnerTeamId: null,
};

test("an exact score uses the room exact-score value", () => {
  const points = scorePrediction(
    groupMatch,
    exactPrediction,
    { groupExactPoints: 7, groupOutcomePoints: 2, knockoutAdvancePoints: 3 },
    new Set(["EXACT_SCORE", "MATCH_OUTCOME"]),
  );
  assert.equal(points, 7);
});

test("an exact score falls back to outcome points when exact score is disabled", () => {
  const points = scorePrediction(
    groupMatch,
    exactPrediction,
    { groupExactPoints: 7, groupOutcomePoints: 2, knockoutAdvancePoints: 3 },
    new Set(["MATCH_OUTCOME"]),
  );
  assert.equal(points, 2);
});

test("base predictions score zero when their room base markets are disabled", () => {
  assert.equal(scorePrediction(groupMatch, exactPrediction, undefined, new Set()), 0);
});

test("a derived bonus uses the configured room value", () => {
  const points = scoreMarketAnswer({
    answer: { marketKey: "BOTH_TEAMS_SCORE", value: { value: "YES" } },
    match: groupMatch,
    pointsByMarket: { BOTH_TEAMS_SCORE: 5 } as Parameters<
      typeof scoreMarketAnswer
    >[0]["pointsByMarket"],
  });
  assert.equal(points, 5);
});

test("unfinished matches never award bonus points", () => {
  const points = scoreMarketAnswer({
    answer: { marketKey: "BOTH_TEAMS_SCORE", value: { value: "YES" } },
    match: { status: "LIVE", homeScore: 2, awayScore: 1 },
    pointsByMarket: { BOTH_TEAMS_SCORE: 5 } as Parameters<
      typeof scoreMarketAnswer
    >[0]["pointsByMarket"],
  });
  assert.equal(points, 0);
});

test("historical bonus answers score zero when the room disables that market", () => {
  const points = scoreEnabledMarketAnswer({
    answer: { marketKey: "BOTH_TEAMS_SCORE", value: { value: "YES" } },
    match: groupMatch,
    pointsByMarket: { BOTH_TEAMS_SCORE: 5 } as Parameters<
      typeof scoreMarketAnswer
    >[0]["pointsByMarket"],
    enabledMarkets: new Set(),
  });
  assert.equal(points, 0);
});
