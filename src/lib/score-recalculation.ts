import { Prisma, type PrismaClient } from "@prisma/client";
import { roomMarketPoints, scoreEnabledMarketAnswer } from "@/lib/market-scoring";
import { parseEnabledMarkets } from "@/lib/room-presets";
import { scorePrediction } from "@/lib/scoring";
import { defaultScoringRules, getScoringRules } from "@/lib/scoring-settings";
import { scoringRulesFromRoomRuleSet } from "@/lib/rooms";

type DbClient = PrismaClient | Prisma.TransactionClient;
type Scope = { matchId?: string; roomId?: string };

function whereFor(scope: Scope) {
  return {
    ...(scope.matchId ? { matchId: scope.matchId } : {}),
    ...(scope.roomId ? { roomId: scope.roomId } : {}),
  };
}

async function updatePoints(
  db: DbClient,
  table: "Prediction" | "PredictionAnswer",
  rows: Array<{ id: string; points: number }>,
) {
  if (rows.length === 0) return;

  const values = Prisma.join(
    rows.map((row) => Prisma.sql`(${row.id}::text, ${row.points}::integer)`),
  );
  await db.$executeRaw(Prisma.sql`
    UPDATE ${Prisma.raw(`"${table}"`)} AS target
    SET points = updates.points
    FROM (VALUES ${values}) AS updates(id, points)
    WHERE target.id = updates.id
      AND target.points IS DISTINCT FROM updates.points
  `);
}

export async function refreshRoomLeaderboards(db: DbClient, roomIds: string[]) {
  const uniqueRoomIds = [...new Set(roomIds)];
  if (uniqueRoomIds.length === 0) return;

  await db.$executeRaw(Prisma.sql`
    INSERT INTO "RoomLeaderboardEntry" (
      "roomId", "userId", "totalPoints", "predictionCount", "updatedAt"
    )
    SELECT
      member."roomId",
      member."userId",
      COALESCE(scores."totalPoints", 0),
      COALESCE(scores."predictionCount", 0),
      CURRENT_TIMESTAMP
    FROM "RoomMember" member
    LEFT JOIN (
      SELECT
        entries."roomId",
        entries."userId",
        SUM(entries.points)::INTEGER AS "totalPoints",
        COUNT(*)::INTEGER AS "predictionCount"
      FROM (
        SELECT "roomId", "userId", points
        FROM "Prediction"
        WHERE "roomId" IN (${Prisma.join(uniqueRoomIds)})
        UNION ALL
        SELECT "roomId", "userId", points
        FROM "PredictionAnswer"
        WHERE "roomId" IN (${Prisma.join(uniqueRoomIds)})
      ) entries
      GROUP BY entries."roomId", entries."userId"
    ) scores
      ON scores."roomId" = member."roomId"
      AND scores."userId" = member."userId"
    WHERE member."roomId" IN (${Prisma.join(uniqueRoomIds)})
    ON CONFLICT ("roomId", "userId") DO UPDATE SET
      "totalPoints" = EXCLUDED."totalPoints",
      "predictionCount" = EXCLUDED."predictionCount",
      "updatedAt" = CURRENT_TIMESTAMP
  `);
}

export async function recalculateScoresInScope(db: DbClient, scope: Scope = {}) {
  const [predictions, answers] = await Promise.all([
    db.prediction.findMany({
      where: whereFor(scope),
      include: { match: true, room: { include: { ruleSet: true } } },
    }),
    db.predictionAnswer.findMany({
      where: whereFor(scope),
      include: { match: true, room: { include: { ruleSet: true } } },
    }),
  ]);

  const matchIds = [...new Set(answers.map((answer) => answer.matchId))];
  const marketResults = matchIds.length
    ? await db.matchMarketResult.findMany({ where: { matchId: { in: matchIds } } })
    : [];
  const resultByMatchAndMarket = new Map(
    marketResults.map((result) => [`${result.matchId}:${result.marketKey}`, result]),
  );

  const needsDefaultRules = predictions.some((prediction) => !prediction.roomId);
  const globalRules = needsDefaultRules ? await getScoringRules() : defaultScoringRules;

  const predictionUpdates = predictions.map((prediction) => {
    const ruleSet = prediction.room?.ruleSet;
    const enabledMarkets = ruleSet
      ? new Set(parseEnabledMarkets(ruleSet.enabledMarkets))
      : new Set(["EXACT_SCORE", "MATCH_OUTCOME", "ADVANCING_TEAM"]);
    return {
      id: prediction.id,
      points: scorePrediction(
        prediction.match,
        prediction,
        ruleSet ? scoringRulesFromRoomRuleSet(ruleSet) : globalRules,
        enabledMarkets,
      ),
    };
  });

  const answerUpdates = answers.map((answer) => {
    const enabledMarkets = new Set(parseEnabledMarkets(answer.room.ruleSet?.enabledMarkets));
    return {
      id: answer.id,
      points: scoreEnabledMarketAnswer({
        answer,
        match: answer.match,
        result: resultByMatchAndMarket.get(`${answer.matchId}:${answer.marketKey}`),
        pointsByMarket: roomMarketPoints(answer.room.ruleSet),
        enabledMarkets,
      }),
    };
  });

  await updatePoints(db, "Prediction", predictionUpdates);
  await updatePoints(db, "PredictionAnswer", answerUpdates);

  const affectedRoomIds = [
    ...predictions.flatMap((prediction) => (prediction.roomId ? [prediction.roomId] : [])),
    ...answers.map((answer) => answer.roomId),
    ...(scope.roomId ? [scope.roomId] : []),
  ];
  await refreshRoomLeaderboards(db, affectedRoomIds);

  return {
    predictions: predictionUpdates.length,
    bonusAnswers: answerUpdates.length,
    rooms: new Set(affectedRoomIds).size,
  };
}
