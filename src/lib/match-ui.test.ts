import assert from "node:assert/strict";
import test from "node:test";
import { defaultDateKey, TBD_DATE_KEY } from "./match-ui";

const tabs = [
  { dateKey: "2026-07-10", kickoffAt: new Date("2026-07-10T18:00:00.000Z") },
  { dateKey: "2026-07-14", kickoffAt: new Date("2026-07-14T18:00:00.000Z") },
  { dateKey: TBD_DATE_KEY, kickoffAt: null },
];

test("la fecha inicial es hoy cuando hay partidos hoy", () => {
  assert.equal(defaultDateKey(tabs, new Date("2026-07-14T12:00:00.000Z")), "2026-07-14");
});

test("sin partidos hoy se elige la fecha mas cercana", () => {
  assert.equal(defaultDateKey(tabs, new Date("2026-07-12T00:00:00.000Z")), "2026-07-10");
  assert.equal(defaultDateKey(tabs, new Date("2026-07-30T00:00:00.000Z")), "2026-07-14");
});

test("sin fechas programadas cae en el grupo por confirmar", () => {
  assert.equal(defaultDateKey([{ dateKey: TBD_DATE_KEY, kickoffAt: null }]), TBD_DATE_KEY);
  assert.equal(defaultDateKey([]), TBD_DATE_KEY);
});
