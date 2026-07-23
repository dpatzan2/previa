import assert from "node:assert/strict";
import test from "node:test";
import type { MatchStage } from "@prisma/client";
import { computePhaseDeadlines, isMatchLockedForPicks, matchDeadlineAt } from "./phase-deadlines";

const HOUR = 60 * 60 * 1000;
const config = { mode: "PER_MATCH" as const, hoursBefore: 1 };

function match(stage: MatchStage, kickoffAt: Date) {
  return { stage, kickoffAt, status: "SCHEDULED" as const };
}

test("con limite por partido, la edicion cierra una hora antes del inicio", () => {
  const kickoff = new Date("2026-07-18T15:00:00.000Z");
  const third = match("THIRD_PLACE", kickoff);
  const deadlines = computePhaseDeadlines([third], new Date(), config);

  assert.deepEqual(matchDeadlineAt(third, config), new Date("2026-07-18T14:00:00.000Z"));
  // Un minuto antes del limite todavia se edita; en el limite y despues, no.
  assert.equal(isMatchLockedForPicks(third, deadlines, new Date(kickoff.getTime() - HOUR - 60_000), config), false);
  assert.equal(isMatchLockedForPicks(third, deadlines, new Date(kickoff.getTime() - HOUR), config), true);
  assert.equal(isMatchLockedForPicks(third, deadlines, new Date(kickoff.getTime() + HOUR), config), true);
});

test("el limite por fase usa el primer partido de la fase", () => {
  const first = match("SEMIFINAL", new Date("2026-07-15T18:00:00.000Z"));
  const second = match("SEMIFINAL", new Date("2026-07-16T18:00:00.000Z"));
  const phaseConfig = { mode: "PHASE" as const, hoursBefore: 2 };
  const deadlines = computePhaseDeadlines([first, second], new Date("2026-07-15T17:00:00.000Z"), phaseConfig);

  assert.deepEqual(deadlines.get("SEMIFINAL")?.deadlineAt, new Date("2026-07-15T16:00:00.000Z"));
  assert.equal(deadlines.get("SEMIFINAL")?.deadlineLocked, true);
  // El segundo partido cierra con la fase, no una hora antes de su propio inicio.
  assert.equal(isMatchLockedForPicks(second, deadlines, new Date("2026-07-15T17:00:00.000Z"), phaseConfig), true);
});
