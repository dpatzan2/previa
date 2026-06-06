-- CreateTable
CREATE TABLE "ScoringSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "groupExactPoints" INTEGER NOT NULL DEFAULT 3,
    "groupOutcomePoints" INTEGER NOT NULL DEFAULT 2,
    "knockoutAdvancePoints" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoringSettings_pkey" PRIMARY KEY ("id")
);
