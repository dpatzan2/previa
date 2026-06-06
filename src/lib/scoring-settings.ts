import { prisma } from "@/lib/db";

export const SCORING_SETTINGS_ID = "default";

export type ScoringRules = {
  groupExactPoints: number;
  groupOutcomePoints: number;
  knockoutAdvancePoints: number;
};

export const defaultScoringRules: ScoringRules = {
  groupExactPoints: 3,
  groupOutcomePoints: 1,
  knockoutAdvancePoints: 3,
};

export async function getScoringRules(): Promise<ScoringRules> {
  if (typeof prisma.scoringSettings?.findUnique !== "function") {
    return defaultScoringRules;
  }

  const settings = await prisma.scoringSettings.findUnique({
    where: { id: SCORING_SETTINGS_ID },
  });

  if (!settings) return defaultScoringRules;

  return {
    groupExactPoints: settings.groupExactPoints,
    groupOutcomePoints: settings.groupOutcomePoints,
    knockoutAdvancePoints: settings.knockoutAdvancePoints,
  };
}
