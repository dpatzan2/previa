-- Foundation for SaaS-level competition administration.
CREATE TYPE "CompetitionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "CompetitionPhaseFormat" AS ENUM ('GROUP', 'KNOCKOUT', 'LEAGUE');

CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "TournamentType" NOT NULL,
    "status" "CompetitionStatus" NOT NULL DEFAULT 'DRAFT',
    "season" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Guatemala',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompetitionPhase" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "MatchStage",
    "format" "CompetitionPhaseFormat" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "groupCode" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionPhase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompetitionTeam" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "groupCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionTeam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompetitionMatch" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "phaseId" TEXT,
    "matchNumber" INTEGER,
    "kickoffAt" TIMESTAMP(3),
    "venue" TEXT,
    "homeTeamId" TEXT,
    "awayTeamId" TEXT,
    "homePlaceholder" TEXT,
    "awayPlaceholder" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionMatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");
CREATE INDEX "Competition_status_idx" ON "Competition"("status");
CREATE INDEX "Competition_type_idx" ON "Competition"("type");

CREATE INDEX "CompetitionPhase_competitionId_idx" ON "CompetitionPhase"("competitionId");
CREATE INDEX "CompetitionPhase_format_idx" ON "CompetitionPhase"("format");
CREATE UNIQUE INDEX "CompetitionPhase_competitionId_sortOrder_key" ON "CompetitionPhase"("competitionId", "sortOrder");

CREATE INDEX "CompetitionTeam_competitionId_idx" ON "CompetitionTeam"("competitionId");
CREATE INDEX "CompetitionTeam_groupCode_idx" ON "CompetitionTeam"("groupCode");
CREATE UNIQUE INDEX "CompetitionTeam_competitionId_normalizedName_key" ON "CompetitionTeam"("competitionId", "normalizedName");

CREATE INDEX "CompetitionMatch_competitionId_idx" ON "CompetitionMatch"("competitionId");
CREATE INDEX "CompetitionMatch_phaseId_idx" ON "CompetitionMatch"("phaseId");
CREATE INDEX "CompetitionMatch_kickoffAt_idx" ON "CompetitionMatch"("kickoffAt");
CREATE UNIQUE INDEX "CompetitionMatch_competitionId_matchNumber_key" ON "CompetitionMatch"("competitionId", "matchNumber");

ALTER TABLE "CompetitionPhase" ADD CONSTRAINT "CompetitionPhase_competitionId_fkey"
FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompetitionTeam" ADD CONSTRAINT "CompetitionTeam_competitionId_fkey"
FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompetitionMatch" ADD CONSTRAINT "CompetitionMatch_competitionId_fkey"
FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompetitionMatch" ADD CONSTRAINT "CompetitionMatch_phaseId_fkey"
FOREIGN KEY ("phaseId") REFERENCES "CompetitionPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CompetitionMatch" ADD CONSTRAINT "CompetitionMatch_homeTeamId_fkey"
FOREIGN KEY ("homeTeamId") REFERENCES "CompetitionTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CompetitionMatch" ADD CONSTRAINT "CompetitionMatch_awayTeamId_fkey"
FOREIGN KEY ("awayTeamId") REFERENCES "CompetitionTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
