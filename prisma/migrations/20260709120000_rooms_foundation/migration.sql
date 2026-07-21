-- CreateEnum
CREATE TYPE "RoomMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TournamentType" AS ENUM ('WORLD_CUP', 'INTERNATIONAL_CUP', 'CLUB_TOURNAMENT', 'DOMESTIC_LEAGUE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RoomConfigPreset" AS ENUM ('BASIC', 'INTERMEDIATE', 'COMPLETE', 'CUSTOM');

-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN "roomId" TEXT;

-- DropIndex
DROP INDEX "Prediction_userId_matchId_key";

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "tournamentType" "TournamentType" NOT NULL,
    "tournamentName" TEXT NOT NULL,
    "externalTournamentId" TEXT,
    "configPreset" "RoomConfigPreset" NOT NULL DEFAULT 'BASIC',
    "status" "RoomStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomMember" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RoomMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomRuleSet" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "preset" "RoomConfigPreset" NOT NULL DEFAULT 'BASIC',
    "exactScorePoints" INTEGER NOT NULL DEFAULT 3,
    "outcomePoints" INTEGER NOT NULL DEFAULT 1,
    "advancePickPoints" INTEGER NOT NULL DEFAULT 1,
    "enabledMarkets" JSONB NOT NULL,
    "customMarketConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomRuleSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_accessCode_key" ON "Room"("accessCode");

-- CreateIndex
CREATE INDEX "Room_ownerId_idx" ON "Room"("ownerId");

-- CreateIndex
CREATE INDEX "Room_status_idx" ON "Room"("status");

-- CreateIndex
CREATE INDEX "Room_tournamentType_idx" ON "Room"("tournamentType");

-- CreateIndex
CREATE INDEX "RoomMember_userId_idx" ON "RoomMember"("userId");

-- CreateIndex
CREATE INDEX "RoomMember_role_idx" ON "RoomMember"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMember_roomId_userId_key" ON "RoomMember"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomRuleSet_roomId_key" ON "RoomRuleSet"("roomId");

-- CreateIndex
CREATE INDEX "Prediction_roomId_idx" ON "Prediction"("roomId");

-- CreateIndex
CREATE INDEX "Prediction_userId_matchId_idx" ON "Prediction"("userId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_roomId_userId_matchId_key" ON "Prediction"("roomId", "userId", "matchId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomRuleSet" ADD CONSTRAINT "RoomRuleSet_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
