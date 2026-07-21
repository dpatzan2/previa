-- CreateTable
CREATE TABLE "PredictionAnswer" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "marketKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PredictionAnswer_roomId_userId_matchId_marketKey_key" ON "PredictionAnswer"("roomId", "userId", "matchId", "marketKey");

-- CreateIndex
CREATE INDEX "PredictionAnswer_roomId_matchId_idx" ON "PredictionAnswer"("roomId", "matchId");

-- CreateIndex
CREATE INDEX "PredictionAnswer_userId_idx" ON "PredictionAnswer"("userId");

-- CreateIndex
CREATE INDEX "PredictionAnswer_marketKey_idx" ON "PredictionAnswer"("marketKey");

-- AddForeignKey
ALTER TABLE "PredictionAnswer" ADD CONSTRAINT "PredictionAnswer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionAnswer" ADD CONSTRAINT "PredictionAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionAnswer" ADD CONSTRAINT "PredictionAnswer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
