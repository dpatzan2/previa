import "dotenv/config";

import { MatchStage, PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import fixture from "./fixture-data.json";
import { parseAppDateTime } from "../src/lib/timezone";
import { scorePrediction } from "../src/lib/scoring";

const DEFAULT_ROOM_CODE = "MUNDIAL";

const defaultSeedScoringRules = {
  groupExactPoints: 3,
  groupOutcomePoints: 1,
  knockoutAdvancePoints: 1,
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function normalized(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

async function main() {
  const teamByName = new Map<string, string>();

  for (const team of fixture.teams) {
    const saved = await prisma.team.upsert({
      where: { normalizedName: normalized(team.name) },
      update: { name: team.name, groupCode: team.groupCode },
      create: {
        name: team.name,
        normalizedName: normalized(team.name),
        groupCode: team.groupCode,
      },
    });
    teamByName.set(saved.name, saved.id);
  }

  for (const match of fixture.matches) {
    await prisma.match.upsert({
      where: { matchNumber: match.matchNumber },
      update: {
        stage: match.stage as MatchStage,
        groupCode: match.groupCode,
        dateLabel: match.dateLabel,
        timeLabel: match.timeLabel,
        kickoffAt: parseAppDateTime(match.kickoffAt),
        venue: match.venue,
        venueShort: match.venueShort,
        homeTeamId: match.homeTeam ? teamByName.get(match.homeTeam) : null,
        awayTeamId: match.awayTeam ? teamByName.get(match.awayTeam) : null,
        homePlaceholder: match.homePlaceholder,
        awayPlaceholder: match.awayPlaceholder,
      },
      create: {
        matchNumber: match.matchNumber,
        stage: match.stage as MatchStage,
        groupCode: match.groupCode,
        dateLabel: match.dateLabel,
        timeLabel: match.timeLabel,
        kickoffAt: parseAppDateTime(match.kickoffAt),
        venue: match.venue,
        venueShort: match.venueShort,
        homeTeamId: match.homeTeam ? teamByName.get(match.homeTeam) : null,
        awayTeamId: match.awayTeam ? teamByName.get(match.awayTeam) : null,
        homePlaceholder: match.homePlaceholder,
        awayPlaceholder: match.awayPlaceholder,
      },
    });
  }

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "admin";
  const displayName = process.env.ADMIN_DISPLAY_NAME ?? "Administrador";

  const adminUser = await prisma.user.upsert({
    where: { username },
    update: {
      displayName,
      role: Role.ADMIN,
      isActive: true,
      canParticipate: false,
    },
    create: {
      username,
      displayName,
      role: Role.ADMIN,
      canParticipate: false,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  await prisma.scoringSettings.upsert({
    where: { id: "default" },
    update: defaultSeedScoringRules,
    create: { id: "default", ...defaultSeedScoringRules },
  });

  const defaultRoom = await prisma.room.upsert({
    where: { accessCode: DEFAULT_ROOM_CODE },
    update: {
      name: "Mundial Quiniela 2026",
      tournamentName: "Mundial 2026",
      tournamentType: "WORLD_CUP",
      configPreset: "BASIC",
      ownerId: adminUser.id,
    },
    create: {
      name: "Mundial Quiniela 2026",
      accessCode: DEFAULT_ROOM_CODE,
      tournamentName: "Mundial 2026",
      tournamentType: "WORLD_CUP",
      configPreset: "BASIC",
      ownerId: adminUser.id,
      ruleSet: {
        create: {
          preset: "BASIC",
          exactScorePoints: defaultSeedScoringRules.groupExactPoints,
          outcomePoints: defaultSeedScoringRules.groupOutcomePoints,
          advancePickPoints: defaultSeedScoringRules.knockoutAdvancePoints,
          enabledMarkets: ["EXACT_SCORE", "MATCH_OUTCOME", "ADVANCING_TEAM"],
        },
      },
    },
  });

  await prisma.roomRuleSet.upsert({
    where: { roomId: defaultRoom.id },
    update: {
      preset: "BASIC",
      exactScorePoints: defaultSeedScoringRules.groupExactPoints,
      outcomePoints: defaultSeedScoringRules.groupOutcomePoints,
      advancePickPoints: defaultSeedScoringRules.knockoutAdvancePoints,
      enabledMarkets: ["EXACT_SCORE", "MATCH_OUTCOME", "ADVANCING_TEAM"],
    },
    create: {
      roomId: defaultRoom.id,
      preset: "BASIC",
      exactScorePoints: defaultSeedScoringRules.groupExactPoints,
      outcomePoints: defaultSeedScoringRules.groupOutcomePoints,
      advancePickPoints: defaultSeedScoringRules.knockoutAdvancePoints,
      enabledMarkets: ["EXACT_SCORE", "MATCH_OUTCOME", "ADVANCING_TEAM"],
    },
  });

  await prisma.roomMember.upsert({
    where: { roomId_userId: { roomId: defaultRoom.id, userId: adminUser.id } },
    update: { role: "OWNER" },
    create: {
      roomId: defaultRoom.id,
      userId: adminUser.id,
      role: "OWNER",
    },
  });

  const participants = await prisma.user.findMany({
    where: { isActive: true, canParticipate: true },
    select: { id: true },
  });

  for (const participant of participants) {
    await prisma.roomMember.upsert({
      where: { roomId_userId: { roomId: defaultRoom.id, userId: participant.id } },
      update: {},
      create: {
        roomId: defaultRoom.id,
        userId: participant.id,
        role: "MEMBER",
      },
    });
  }

  const globalPredictions = await prisma.prediction.findMany({
    where: { roomId: null },
    include: { match: true },
  });

  for (const prediction of globalPredictions) {
    await prisma.prediction.upsert({
      where: {
        roomId_userId_matchId: {
          roomId: defaultRoom.id,
          userId: prediction.userId,
          matchId: prediction.matchId,
        },
      },
      update: {
        predictedHomeScore: prediction.predictedHomeScore,
        predictedAwayScore: prediction.predictedAwayScore,
        predictedWinnerTeamId: prediction.predictedWinnerTeamId,
        predictedWinnerSide: prediction.predictedWinnerSide,
        points: prediction.points,
      },
      create: {
        roomId: defaultRoom.id,
        userId: prediction.userId,
        matchId: prediction.matchId,
        predictedHomeScore: prediction.predictedHomeScore,
        predictedAwayScore: prediction.predictedAwayScore,
        predictedWinnerTeamId: prediction.predictedWinnerTeamId,
        predictedWinnerSide: prediction.predictedWinnerSide,
        points: prediction.points,
      },
    });
  }

  const predictions = await prisma.prediction.findMany({ include: { match: true } });
  for (const prediction of predictions) {
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        points: scorePrediction(prediction.match, prediction, defaultSeedScoringRules),
      },
    });
  }

  console.log("Seed complete");
  console.log(`Sala default: ${defaultRoom.name} (${defaultRoom.accessCode})`);
  if (predictions.length > 0) {
    console.log(`Pronosticos recalculados: ${predictions.length}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
