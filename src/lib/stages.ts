import type { MatchStage } from "@prisma/client";

export const stageLabels: Record<MatchStage, string> = {
  GROUP: "Fase de grupos",
  ROUND_OF_32: "Dieciseisavos",
  ROUND_OF_16: "Octavos",
  QUARTER_FINAL: "Cuartos",
  SEMIFINAL: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
};

export const stageOrder: MatchStage[] = [
  "GROUP",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMIFINAL",
  "THIRD_PLACE",
  "FINAL",
];

/** Fase que debe terminar antes de abrir pronosticos de `stage`. */
export function previousStageForUnlock(stage: MatchStage): MatchStage | null {
  if (stage === "GROUP") return null;
  if (stage === "FINAL") return "SEMIFINAL";
  const index = stageOrder.indexOf(stage);
  return index > 0 ? stageOrder[index - 1] : null;
}
