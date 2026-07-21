import assert from "node:assert/strict";
import test from "node:test";
import { calculateBestThirds, calculateStandings } from "./competition-insights";

const teams = ["A", "B", "C", "D"].map((name) => ({ id: name, name, logoUrl: null }));

test("orders a group by points, goal difference and goals scored", () => {
  const table = calculateStandings(
    teams,
    [
      { id: "1", kickoffAt: new Date("2026-01-01"), status: "FINISHED", homeScore: 2, awayScore: 0, homeTeam: teams[0], awayTeam: teams[1] },
      { id: "2", kickoffAt: new Date("2026-01-02"), status: "FINISHED", homeScore: 1, awayScore: 1, homeTeam: teams[2], awayTeam: teams[3] },
      { id: "3", kickoffAt: new Date("2026-01-03"), status: "FINISHED", homeScore: 0, awayScore: 1, homeTeam: teams[0], awayTeam: teams[2] },
    ],
    2,
  );

  assert.deepEqual(table.map((row) => row.team.id), ["C", "A", "D", "B"]);
  assert.equal(table[0].qualification, "AUTOMATIC");
  assert.equal(table[2].form.at(-1), "D");
});

test("marks only the configured number of best thirds", () => {
  const first = calculateStandings(teams.slice(0, 3), [], 2);
  const second = calculateStandings(
    teams.slice(1),
    [{ id: "4", kickoffAt: new Date(), status: "FINISHED", homeScore: 3, awayScore: 0, homeTeam: teams[3], awayTeam: teams[1] }],
    2,
  );
  const bestThirds = calculateBestThirds([first, second], 1);

  assert.equal(bestThirds.length, 2);
  assert.equal(bestThirds.filter((row) => row.qualification === "BEST_THIRD").length, 1);
});
