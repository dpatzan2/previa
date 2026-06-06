import type { MatchStage } from "@prisma/client";
import { formatAppDateTime } from "@/lib/timezone";

const MS_DAY = 24 * 60 * 60 * 1000;

export type PhaseDeadlineInfo = {
  stage: MatchStage;
  startsAt: Date;
  deadlineAt: Date;
  locked: boolean;
  deadlineLabel: string;
  startsLabel: string;
};

export type SerializedPhaseDeadline = {
  stage: MatchStage;
  deadlineAt: string;
  startsAt: string;
  locked: boolean;
  deadlineLabel: string;
  startsLabel: string;
};

export function computePhaseDeadlines(
  matches: Array<{ stage: MatchStage; kickoffAt: Date | null }>,
  now = new Date(),
): Map<MatchStage, PhaseDeadlineInfo> {
  const firstKickoffByStage = new Map<MatchStage, Date>();

  for (const match of matches) {
    if (!match.kickoffAt) continue;
    const current = firstKickoffByStage.get(match.stage);
    if (!current || match.kickoffAt < current) {
      firstKickoffByStage.set(match.stage, match.kickoffAt);
    }
  }

  const deadlines = new Map<MatchStage, PhaseDeadlineInfo>();

  for (const [stage, startsAt] of firstKickoffByStage) {
    const deadlineAt = new Date(startsAt.getTime() - MS_DAY);
    deadlines.set(stage, {
      stage,
      startsAt,
      deadlineAt,
      locked: now >= deadlineAt,
      deadlineLabel: formatAppDateTime(deadlineAt),
      startsLabel: formatAppDateTime(startsAt),
    });
  }

  return deadlines;
}

export function isPhaseLockedForPicks(
  stage: MatchStage,
  deadlines: Map<MatchStage, PhaseDeadlineInfo>,
) {
  return deadlines.get(stage)?.locked ?? false;
}

export function isMatchLockedForPicks(
  match: { stage: MatchStage },
  deadlines: Map<MatchStage, PhaseDeadlineInfo>,
) {
  return isPhaseLockedForPicks(match.stage, deadlines);
}

export function hasOpenPickPhases(deadlines: Map<MatchStage, PhaseDeadlineInfo>) {
  return Array.from(deadlines.values()).some((item) => !item.locked);
}

export function serializePhaseDeadlines(
  deadlines: Map<MatchStage, PhaseDeadlineInfo>,
): SerializedPhaseDeadline[] {
  return Array.from(deadlines.values()).map((item) => ({
    stage: item.stage,
    deadlineAt: item.deadlineAt.toISOString(),
    startsAt: item.startsAt.toISOString(),
    locked: item.locked,
    deadlineLabel: item.deadlineLabel,
    startsLabel: item.startsLabel,
  }));
}

export function deadlinesByStage(deadlines: SerializedPhaseDeadline[]) {
  return Object.fromEntries(deadlines.map((item) => [item.stage, item])) as Record<
    MatchStage,
    SerializedPhaseDeadline
  >;
}
