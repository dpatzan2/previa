export type RankStanding = {
  userId: string;
  points: number;
  predictionCount: number;
};

// Mismo desempate que la tabla: puntos, luego pronosticos, luego userId.
function rankOrder(standings: RankStanding[]) {
  return [...standings].sort(
    (a, b) =>
      b.points - a.points ||
      b.predictionCount - a.predictionCount ||
      a.userId.localeCompare(b.userId),
  );
}

/**
 * Escalones ganados (+) o perdidos (-) por usuario respecto a la tabla antes de la ultima jornada.
 * `lastDayPoints` son los puntos que cada usuario sumo en esa jornada.
 */
export function rankMovements(
  current: RankStanding[],
  lastDayPoints: Map<string, number>,
): Map<string, number> {
  const before = rankOrder(
    current.map((row) => ({ ...row, points: row.points - (lastDayPoints.get(row.userId) ?? 0) })),
  );
  const previousPlace = new Map(before.map((row, index) => [row.userId, index]));
  return new Map(
    rankOrder(current).map((row, index) => [
      row.userId,
      (previousPlace.get(row.userId) ?? index) - index,
    ]),
  );
}
