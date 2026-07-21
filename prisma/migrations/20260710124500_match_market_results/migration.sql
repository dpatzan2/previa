-- Official results for configurable room markets.
-- These are global per match because the same real match result can score many rooms.
CREATE TABLE "MatchMarketResult" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "marketKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchMarketResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MatchMarketResult_matchId_marketKey_key"
ON "MatchMarketResult"("matchId", "marketKey");

CREATE INDEX "MatchMarketResult_marketKey_idx"
ON "MatchMarketResult"("marketKey");

ALTER TABLE "MatchMarketResult"
ADD CONSTRAINT "MatchMarketResult_matchId_fkey"
FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
