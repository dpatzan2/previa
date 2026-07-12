-- PostgreSQL treats NULL values as distinct in composite unique indexes.
-- Room predictions are protected by the existing roomId/userId/matchId unique index.
-- This partial unique index keeps the legacy global pool unique as well.
CREATE UNIQUE INDEX "Prediction_global_userId_matchId_key"
ON "Prediction"("userId", "matchId")
WHERE "roomId" IS NULL;
