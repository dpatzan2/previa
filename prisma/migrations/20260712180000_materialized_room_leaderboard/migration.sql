-- Fast, pre-aggregated room standings.
CREATE TABLE "RoomLeaderboardEntry" (
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "predictionCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomLeaderboardEntry_pkey" PRIMARY KEY ("roomId", "userId")
);

CREATE INDEX "RoomLeaderboardEntry_roomId_totalPoints_userId_idx"
ON "RoomLeaderboardEntry"("roomId", "totalPoints" DESC, "userId");

CREATE INDEX "RoomLeaderboardEntry_userId_idx"
ON "RoomLeaderboardEntry"("userId");

-- These support recalculating only the predictions affected by one final result.
CREATE INDEX "Prediction_matchId_roomId_idx" ON "Prediction"("matchId", "roomId");
CREATE INDEX "PredictionAnswer_matchId_roomId_marketKey_idx"
ON "PredictionAnswer"("matchId", "roomId", "marketKey");

ALTER TABLE "RoomLeaderboardEntry"
ADD CONSTRAINT "RoomLeaderboardEntry_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoomLeaderboardEntry"
ADD CONSTRAINT "RoomLeaderboardEntry_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Populate standings for existing rooms when deploying the migration.
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
        WHERE "roomId" IS NOT NULL
        UNION ALL
        SELECT "roomId", "userId", points
        FROM "PredictionAnswer"
    ) entries
    GROUP BY entries."roomId", entries."userId"
) scores
ON scores."roomId" = member."roomId" AND scores."userId" = member."userId";
