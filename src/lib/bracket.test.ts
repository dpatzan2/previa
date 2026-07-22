import assert from "node:assert/strict";
import test from "node:test";
import { buildBracket, flattenSide, winnerSide, type BracketMatch, type BracketPhase } from "./bracket";

function team(name: string) {
  return { id: name, name, logoUrl: null };
}

function match(
  matchNumber: number,
  home: string | null,
  away: string | null,
  homeScore: number | null = null,
  awayScore: number | null = null,
): BracketMatch {
  return {
    id: `m${matchNumber}`,
    matchNumber,
    kickoffAt: null,
    status: homeScore === null ? "SCHEDULED" : "FINISHED",
    homeScore,
    awayScore,
    actualWinnerSide: null,
    homePlaceholder: null,
    awayPlaceholder: null,
    homeTeam: home ? team(home) : null,
    awayTeam: away ? team(away) : null,
  };
}

function phase(sortOrder: number, name: string, matches: BracketMatch[]): BracketPhase {
  return { id: name, name, format: "KNOCKOUT", sortOrder, matches };
}

// Recorte real del Mundial 2026 cargado en la app: cuartos hacia la final.
const worldCup: BracketPhase[] = [
  phase(1, "Grupo A", []),
  phase(15, "Cuartos", [
    match(97, "FRANCIA", "MARRUECOS", 2, 0),
    match(98, "ESPAÑA", "BÉLGICA", 2, 1),
    match(99, "NORUEGA", "INGLATERRA", 1, 2),
    match(100, "ARGENTINA", "SUIZA", 3, 1),
  ]),
  phase(16, "Semifinales", [
    match(101, "FRANCIA", "ESPAÑA", 0, 2),
    match(102, "INGLATERRA", "ARGENTINA", 1, 2),
  ]),
  phase(17, "Tercer puesto", [match(103, "FRANCIA", "INGLATERRA", 4, 6)]),
  phase(18, "Final", [match(104, "ESPAÑA", "ARGENTINA", 1, 0)]),
];
worldCup[0].format = "GROUP";

test("arma el arbol desde la final y separa las mitades por los alimentadores reales", () => {
  const bracket = buildBracket(worldCup);
  assert.ok(bracket);
  assert.deepEqual(bracket.rounds, ["Cuartos", "Semifinales", "Final"]);
  assert.equal(bracket.final.match.matchNumber, 104);
  assert.equal(bracket.thirdPlace?.match.matchNumber, 103);

  // ESPAÑA salio de la semi 101 y ARGENTINA de la 102, aunque 101 no sea "la de la izquierda".
  const [left, right] = bracket.final.feeders;
  assert.equal(left.match.matchNumber, 101);
  assert.equal(right.match.matchNumber, 102);
  assert.deepEqual(left.feeders.map((node) => node.match.matchNumber), [97, 98]);
  assert.deepEqual(right.feeders.map((node) => node.match.matchNumber), [99, 100]);
});

test("cae al emparejamiento secuencial cuando los equipos aun no estan asignados", () => {
  const bracket = buildBracket([
    phase(1, "Semifinales", [match(1, null, null), match(2, null, null), match(3, null, null), match(4, null, null)]),
    phase(2, "Final", [match(5, null, null), match(6, null, null)]),
    phase(3, "Campeon", [match(7, null, null)]),
  ]);
  assert.ok(bracket);
  assert.deepEqual(bracket.thirdPlace, null);
  assert.deepEqual(
    bracket.final.feeders.map((node) => node.feeders.map((leaf) => leaf.match.matchNumber)),
    [[1, 2], [3, 4]],
  );
});

test("no devuelve bracket para una competencia sin eliminatoria", () => {
  assert.equal(buildBracket([{ id: "l", name: "Fase de Liga", format: "LEAGUE", sortOrder: 1, matches: [] }]), null);
});

test("el ganador declarado gana sobre el marcador empatado", () => {
  assert.equal(winnerSide(match(1, "A", "B", 2, 1)), "HOME");
  assert.equal(winnerSide({ ...match(2, "A", "B", 1, 1), actualWinnerSide: "AWAY" }), "AWAY");
  assert.equal(winnerSide(match(3, "A", "B", 1, 1)), null);
  assert.equal(winnerSide(match(4, "A", "B")), null);
});

test("aplana un lado en una columna por ronda", () => {
  const bracket = buildBracket(worldCup)!;
  const columns = flattenSide(bracket.final.feeders[0], 2);
  assert.deepEqual(columns.map((column) => column.map((item) => item.matchNumber)), [[97, 98], [101]]);
});
