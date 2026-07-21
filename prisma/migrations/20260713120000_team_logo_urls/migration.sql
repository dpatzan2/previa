-- These columns existed in the development database before they were tracked by Prisma.
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "CompetitionTeam" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
