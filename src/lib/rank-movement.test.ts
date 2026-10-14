import assert from "node:assert/strict";
import test from "node:test";
import { rankMovements } from "./rank-movement";

const row = (userId: string, points: number) => ({ userId, points, predictionCount: 10 });

test("sube y baja segun los puntos de la ultima jornada", () => {
  // Antes: a 10, b 8, c 5. Jornada: c +6, a +0, b +1 -> c 11, a 10, b 9.
  const moves = rankMovements(
    [row("a", 10), row("b", 9), row("c", 11)],
    new Map([["b", 1], ["c", 6]]),
  );
  assert.equal(moves.get("c"), 2);
  assert.equal(moves.get("a"), -1);
  assert.equal(moves.get("b"), -1);
});

test("sin puntos en la jornada nadie se mueve", () => {
  const moves = rankMovements([row("a", 3), row("b", 1)], new Map());
  assert.equal(moves.get("a"), 0);
  assert.equal(moves.get("b"), 0);
});
