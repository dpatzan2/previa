import assert from "node:assert/strict";
import test from "node:test";
import { isPublicPath } from "./session-cookie";

test("calendar feeds are public for external calendar providers", () => {
  assert.equal(isPublicPath("/api/calendar/competition-123"), true);
  assert.equal(isPublicPath("/calendar"), false);
});
