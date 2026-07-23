import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync("src/app/globals.css", "utf8");

test("shared room and scoreboard surfaces use theme tokens", () => {
  for (const selector of [
    ".stage-row:nth-child(odd)",
    ".scoreboard-badge",
    ".scoreboard-center",
    ".scoreboard-input",
    ".knockout-option-body",
    ".peer-pick-row",
    ".phase-tab,",
    ".points-pill {",
    ".room-market-summary span",
  ]) {
    const start = css.indexOf(selector);
    assert.notEqual(start, -1, `${selector} must exist`);
    const rule = css.slice(start, css.indexOf("}", start));
    assert.match(rule, /background:[^;}]*var\(--panel/, `${selector} must use a theme background`);
  }
});
