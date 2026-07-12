-- Per-room deadline behavior for prediction locks.
CREATE TYPE "RoomDeadlineMode" AS ENUM ('PER_MATCH', 'PHASE');

ALTER TABLE "Room"
ADD COLUMN "deadlineMode" "RoomDeadlineMode" NOT NULL DEFAULT 'PER_MATCH',
ADD COLUMN "deadlineHoursBefore" INTEGER NOT NULL DEFAULT 1;
