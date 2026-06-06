import "dotenv/config";

import { MatchStage, PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import fixture from "./fixture-data.json";
import { parseAppDateTime } from "../src/lib/timezone";

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

  await prisma.user.upsert({
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
    update: {},
    create: {
      id: "default",
      groupExactPoints: 3,
      groupOutcomePoints: 2,
      knockoutAdvancePoints: 3,
    },
  });

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
