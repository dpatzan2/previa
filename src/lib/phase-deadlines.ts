import type { MatchStage, MatchStatus } from "@prisma/client";
import { atAppDay22Hours, formatAppDateTime } from "@/lib/timezone";
import { previousStageForUnlock, stageLabels } from "@/lib/stages";

const MS_DAY = 24 * 60 * 60 * 1000;

export type PhaseDeadlineInfo = {
  stage: MatchStage;
  startsAt: Date;
  deadlineAt: Date;
  peerVisibilityAt: Date;
  locked: boolean;
  deadlineLocked: boolean;
  sequentialLocked: boolean;
  peerPredictionsVisible: boolean;
  previousStage: MatchStage | null;
  deadlineLabel: string;
  startsLabel: string;
  peerVisibilityLabel: string;
};

export type SerializedPhaseDeadline = {
  stage: MatchStage;
  deadlineAt: string;
  startsAt: string;
  peerVisibilityAt: string;
  locked: boolean;
  deadlineLocked: boolean;
  sequentialLocked: boolean;
  peerPredictionsVisible: boolean;
  previousStage: MatchStage | null;
  deadlineLabel: string;
  startsLabel: string;
  peerVisibilityLabel: string;
};

type MatchForPhaseDeadlines = {
  stage: MatchStage;
  kickoffAt: Date | null;
  status: MatchStatus;
};

export function isStageComplete(
  matches: MatchForPhaseDeadlines[],
  stage: MatchStage,
) {
  const stageMatches = matches.filter((match) => match.stage === stage);
  if (stageMatches.length === 0) return true;
  return stageMatches.every((match) => match.status === "FINISHED");
}

export function computePhaseDeadlines(
  matches: MatchForPhaseDeadlines[],
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
    const deadlineAt = atAppDay22Hours(new Date(startsAt.getTime() - MS_DAY));
    const peerVisibilityAt = deadlineAt;
    const deadlineLocked = now >= deadlineAt;
    const previousStage = previousStageForUnlock(stage);
    const sequentialLocked = previousStage
      ? !isStageComplete(matches, previousStage)
      : false;
    const peerPredictionsVisible = now >= peerVisibilityAt;

    deadlines.set(stage, {
      stage,
      startsAt,
      deadlineAt,
      peerVisibilityAt,
      deadlineLocked,
      sequentialLocked,
      peerPredictionsVisible,
      locked: deadlineLocked || sequentialLocked,
      previousStage,
      deadlineLabel: formatAppDateTime(deadlineAt),
      startsLabel: formatAppDateTime(startsAt),
      peerVisibilityLabel: formatAppDateTime(peerVisibilityAt),
    });
  }

  return deadlines;
}

export function arePeerPredictionsVisible(deadline?: SerializedPhaseDeadline | PhaseDeadlineInfo) {
  if (!deadline) return false;
  return deadline.peerPredictionsVisible;
}

export function canViewPeerPredictions(deadline?: SerializedPhaseDeadline | PhaseDeadlineInfo) {
  return arePeerPredictionsVisible(deadline);
}

export function phasePeerVisibilityBanner(deadline: SerializedPhaseDeadline) {
  if (canViewPeerPredictions(deadline)) return null;

  return {
    title: "Pronosticos ocultos",
    message: `Estos pronosticos se podran ver el ${deadline.peerVisibilityLabel} (hora Guatemala).`,
  };
}

export function isPhaseTabEnterable(deadline?: SerializedPhaseDeadline | PhaseDeadlineInfo) {
  if (!deadline) return true;
  if (deadline.deadlineLocked) return true;
  return !deadline.sequentialLocked;
}

export function firstEnterableStage(
  stages: MatchStage[],
  deadlines?: Partial<Record<MatchStage, SerializedPhaseDeadline>>,
) {
  return stages.find((stage) => isPhaseTabEnterable(deadlines?.[stage])) ?? stages[0] ?? "GROUP";
}

export function phaseTabStatusLabel(deadline: SerializedPhaseDeadline) {
  if (deadline.deadlineLocked) return "Cerrada";
  return `Hasta ${deadline.deadlineLabel} GT`;
}

export function phaseDeadlineBanner(
  deadline: SerializedPhaseDeadline,
  { editable = false }: { editable?: boolean } = {},
) {
  if (deadline.deadlineLocked) {
    return {
      closed: true,
      title: editable ? "Fase cerrada · solo lectura" : "Fase cerrada",
      message: editable
        ? `Ya no puedes modificar pronosticos de esta fase. El limite fue el ${deadline.deadlineLabel}.`
        : `El limite de pronosticos fue el ${deadline.deadlineLabel}. La fase inicio el ${deadline.startsLabel}.`,
    };
  }

  if (deadline.sequentialLocked && deadline.previousStage) {
    const previousLabel = stageLabels[deadline.previousStage];
    return {
      closed: true,
      title: editable ? "Fase bloqueada · solo lectura" : "Fase bloqueada",
      message: editable
        ? `Los pronosticos se abriran cuando termine ${previousLabel}.`
        : `Esta fase aun no abre porque ${previousLabel} no ha terminado.`,
    };
  }

  return {
    closed: false,
    title: "Limite de pronosticos",
    message: editable
      ? `Puedes editar hasta el ${deadline.deadlineLabel} (hora Guatemala), un dia antes del inicio el ${deadline.startsLabel}.`
      : `Hasta el ${deadline.deadlineLabel} (hora Guatemala, un dia antes del inicio el ${deadline.startsLabel}).`,
  };
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
    peerVisibilityAt: item.peerVisibilityAt.toISOString(),
    locked: item.locked,
    deadlineLocked: item.deadlineLocked,
    sequentialLocked: item.sequentialLocked,
    peerPredictionsVisible: item.peerPredictionsVisible,
    previousStage: item.previousStage,
    deadlineLabel: item.deadlineLabel,
    startsLabel: item.startsLabel,
    peerVisibilityLabel: item.peerVisibilityLabel,
  }));
}

export function deadlinesByStage(deadlines: SerializedPhaseDeadline[]) {
  return Object.fromEntries(deadlines.map((item) => [item.stage, item])) as Record<
    MatchStage,
    SerializedPhaseDeadline
  >;
}
