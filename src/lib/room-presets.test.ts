import assert from "node:assert/strict";
import test from "node:test";
import { bonusMarketsForStage } from "./room-presets";

test("knockout-only bonus markets are excluded from groups and leagues", () => {
  const markets = ["TOTAL_GOALS", "EXTRA_TIME", "PENALTY_SHOOTOUT"] as const;
  assert.deepEqual(bonusMarketsForStage([...markets], "GROUP"), ["TOTAL_GOALS"]);
  assert.deepEqual(bonusMarketsForStage([...markets], "ROUND_OF_16"), [...markets]);
});
