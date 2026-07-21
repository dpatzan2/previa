CREATE TYPE "PopularPredictionsVisibility" AS ENUM (
  'ALWAYS',
  'AFTER_PICK',
  'AFTER_DEADLINE',
  'HIDDEN'
);

ALTER TABLE "Competition"
  ADD COLUMN "countryCode" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "bannerUrl" TEXT,
  ADD COLUMN "championTeamId" TEXT;

ALTER TABLE "CompetitionPhase"
  ADD COLUMN "automaticQualifiers" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "bestThirdQualifiers" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "CompetitionMatch"
  ADD COLUMN "actualWinnerSide" "PickSide",
  ADD COLUMN "actualWinnerTeamId" TEXT;

ALTER TABLE "Room"
  ADD COLUMN "popularPredictionsVisibility" "PopularPredictionsVisibility" NOT NULL DEFAULT 'AFTER_PICK',
  ADD COLUMN "championPickEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "championPickPoints" INTEGER NOT NULL DEFAULT 5;

ALTER TABLE "Prediction"
  ALTER COLUMN "matchId" DROP NOT NULL,
  ADD COLUMN "competitionMatchId" TEXT,
  ADD COLUMN "predictedWinnerCompetitionTeamId" TEXT;

ALTER TABLE "PredictionAnswer"
  ALTER COLUMN "matchId" DROP NOT NULL,
  ADD COLUMN "competitionMatchId" TEXT;

ALTER TABLE "MatchMarketResult"
  ALTER COLUMN "matchId" DROP NOT NULL,
  ADD COLUMN "competitionMatchId" TEXT;

CREATE TABLE "RoomTournamentPick" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "competitionId" TEXT NOT NULL,
  "predictedTeamId" TEXT NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RoomTournamentPick_pkey" PRIMARY KEY ("id")
);

-- Existing room predictions use projected matches with the canonical match id.
UPDATE "Prediction" prediction
SET "competitionMatchId" = prediction."matchId"
WHERE EXISTS (
  SELECT 1 FROM "CompetitionMatch" match
  WHERE match."id" = prediction."matchId"
);

UPDATE "PredictionAnswer" answer
SET "competitionMatchId" = answer."matchId"
WHERE EXISTS (
  SELECT 1 FROM "CompetitionMatch" match
  WHERE match."id" = answer."matchId"
);

UPDATE "MatchMarketResult" result
SET "competitionMatchId" = result."matchId"
WHERE EXISTS (
  SELECT 1 FROM "CompetitionMatch" match
  WHERE match."id" = result."matchId"
);

UPDATE "CompetitionMatch" competition_match
SET
  "actualWinnerSide" = legacy."actualWinnerSide",
  "actualWinnerTeamId" = (
    SELECT competition_team."id"
    FROM "Team" legacy_winner
    JOIN "CompetitionTeam" competition_team
      ON competition_team."normalizedName" = legacy_winner."normalizedName"
    WHERE legacy_winner."id" = legacy."actualWinnerTeamId"
      AND competition_team."competitionId" = competition_match."competitionId"
    LIMIT 1
  )
FROM "Match" legacy
WHERE legacy."id" = competition_match."id";

UPDATE "Prediction" prediction
SET "predictedWinnerCompetitionTeamId" = (
  SELECT competition_team."id"
  FROM "CompetitionMatch" competition_match
  JOIN "Team" legacy_team ON legacy_team."id" = prediction."predictedWinnerTeamId"
  JOIN "CompetitionTeam" competition_team
    ON competition_team."competitionId" = competition_match."competitionId"
    AND competition_team."normalizedName" = legacy_team."normalizedName"
  WHERE competition_match."id" = prediction."competitionMatchId"
  LIMIT 1
)
WHERE prediction."competitionMatchId" IS NOT NULL
  AND prediction."predictedWinnerTeamId" IS NOT NULL;

-- Old free-form room links may not point to a registered competition.
UPDATE "Room" room
SET "externalTournamentId" = NULL
WHERE room."externalTournamentId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "Competition" competition
    WHERE competition."id" = room."externalTournamentId"
  );

CREATE INDEX "Room_externalTournamentId_idx" ON "Room"("externalTournamentId");
CREATE INDEX "Prediction_competitionMatchId_idx" ON "Prediction"("competitionMatchId");
CREATE UNIQUE INDEX "Prediction_roomId_userId_competitionMatchId_key"
  ON "Prediction"("roomId", "userId", "competitionMatchId");
CREATE INDEX "PredictionAnswer_roomId_competitionMatchId_idx"
  ON "PredictionAnswer"("roomId", "competitionMatchId");
CREATE UNIQUE INDEX "PredictionAnswer_roomId_userId_competitionMatchId_marketKey_key"
  ON "PredictionAnswer"("roomId", "userId", "competitionMatchId", "marketKey");
CREATE INDEX "MatchMarketResult_competitionMatchId_idx"
  ON "MatchMarketResult"("competitionMatchId");
CREATE UNIQUE INDEX "MatchMarketResult_competitionMatchId_marketKey_key"
  ON "MatchMarketResult"("competitionMatchId", "marketKey");
CREATE UNIQUE INDEX "RoomTournamentPick_roomId_userId_competitionId_key"
  ON "RoomTournamentPick"("roomId", "userId", "competitionId");
CREATE INDEX "RoomTournamentPick_roomId_points_idx"
  ON "RoomTournamentPick"("roomId", "points");
CREATE INDEX "RoomTournamentPick_competitionId_idx"
  ON "RoomTournamentPick"("competitionId");

ALTER TABLE "Competition"
  ADD CONSTRAINT "Competition_championTeamId_fkey"
  FOREIGN KEY ("championTeamId") REFERENCES "CompetitionTeam"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CompetitionMatch"
  ADD CONSTRAINT "CompetitionMatch_actualWinnerTeamId_fkey"
  FOREIGN KEY ("actualWinnerTeamId") REFERENCES "CompetitionTeam"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Room"
  ADD CONSTRAINT "Room_externalTournamentId_fkey"
  FOREIGN KEY ("externalTournamentId") REFERENCES "Competition"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prediction"
  ADD CONSTRAINT "Prediction_competitionMatchId_fkey"
  FOREIGN KEY ("competitionMatchId") REFERENCES "CompetitionMatch"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prediction"
  ADD CONSTRAINT "Prediction_predictedWinnerCompetitionTeamId_fkey"
  FOREIGN KEY ("predictedWinnerCompetitionTeamId") REFERENCES "CompetitionTeam"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PredictionAnswer"
  ADD CONSTRAINT "PredictionAnswer_competitionMatchId_fkey"
  FOREIGN KEY ("competitionMatchId") REFERENCES "CompetitionMatch"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchMarketResult"
  ADD CONSTRAINT "MatchMarketResult_competitionMatchId_fkey"
  FOREIGN KEY ("competitionMatchId") REFERENCES "CompetitionMatch"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomTournamentPick"
  ADD CONSTRAINT "RoomTournamentPick_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomTournamentPick"
  ADD CONSTRAINT "RoomTournamentPick_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomTournamentPick"
  ADD CONSTRAINT "RoomTournamentPick_competitionId_fkey"
  FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomTournamentPick"
  ADD CONSTRAINT "RoomTournamentPick_predictedTeamId_fkey"
  FOREIGN KEY ("predictedTeamId") REFERENCES "CompetitionTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
