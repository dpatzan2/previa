"use server";

import { Role, type PickSide } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut, requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canParticipateInPool } from "@/lib/participants";
import { computePhaseDeadlines, isMatchLockedForPicks } from "@/lib/phase-deadlines";
import { scorePrediction } from "@/lib/scoring";
import { getScoringRules, SCORING_SETTINGS_ID } from "@/lib/scoring-settings";
import { syncWc2026Matches } from "@/lib/wc2026";

function readInt(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const ok = await signIn(username, password);
  if (!ok) {
    redirect("/login?error=1");
  }
  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const schema = z.object({
    username: z.string().trim().min(3).max(40),
    displayName: z.string().trim().min(2).max(80),
    password: z.string().min(6),
  });

  const parsed = schema.safeParse({
    username: String(formData.get("username") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    redirect("/register?error=invalid");
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });

  if (existing) {
    redirect("/register?error=taken");
  }

  await prisma.user.create({
    data: {
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      role: Role.PLAYER,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
    },
  });

  await signIn(parsed.data.username, parsed.data.password);
  redirect("/dashboard");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}

export async function savePredictionsAction(formData: FormData) {
  const user = await requireUser();
  if (!canParticipateInPool(user)) return;
  const matches = await prisma.match.findMany({
    orderBy: { matchNumber: "asc" },
  });
  const phaseDeadlines = computePhaseDeadlines(matches);

  for (const match of matches) {
    if (isMatchLockedForPicks(match, phaseDeadlines)) continue;

    const predictedHomeScore = readInt(formData.get(`homeScore:${match.id}`));
    const predictedAwayScore = readInt(formData.get(`awayScore:${match.id}`));
    const side = formData.get(`winnerSide:${match.id}`);

    if (match.stage === "GROUP") {
      if (predictedHomeScore === null || predictedAwayScore === null) continue;
      await prisma.prediction.upsert({
        where: { userId_matchId: { userId: user.id, matchId: match.id } },
        update: {
          predictedHomeScore,
          predictedAwayScore,
          predictedWinnerSide: null,
          predictedWinnerTeamId: null,
          points: 0,
        },
        create: {
          userId: user.id,
          matchId: match.id,
          predictedHomeScore,
          predictedAwayScore,
        },
      });
    } else if (side === "HOME" || side === "AWAY") {
      const teamId = side === "HOME" ? match.homeTeamId : match.awayTeamId;
      await prisma.prediction.upsert({
        where: { userId_matchId: { userId: user.id, matchId: match.id } },
        update: {
          predictedHomeScore: null,
          predictedAwayScore: null,
          predictedWinnerSide: side,
          predictedWinnerTeamId: teamId,
          points: 0,
        },
        create: {
          userId: user.id,
          matchId: match.id,
          predictedWinnerSide: side,
          predictedWinnerTeamId: teamId,
        },
      });
    }
  }

  await recalculateScores();
  revalidatePath("/picks");
  revalidatePath("/leaderboard");
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const schema = z.object({
    username: z.string().min(3).max(40),
    displayName: z.string().min(2).max(80),
    password: z.string().min(6),
    role: z.enum(["ADMIN", "PLAYER"]),
  });

  const parsed = schema.parse({
    username: String(formData.get("username") ?? "").trim(),
    displayName: String(formData.get("displayName") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "PLAYER"),
  });

  await prisma.user.create({
    data: {
      username: parsed.username,
      displayName: parsed.displayName,
      role: parsed.role as Role,
      passwordHash: await bcrypt.hash(parsed.password, 12),
    },
  });

  revalidatePath("/admin");
}

export async function deleteUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) {
    redirect("/admin?error=delete");
  }

  if (userId === admin.id) {
    redirect("/admin?error=self");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    redirect("/admin?error=missing");
  }

  if (target.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount <= 1) {
      redirect("/admin?error=last-admin");
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
}

export async function saveResultsAction(formData: FormData) {
  await requireAdmin();
  const matches = await prisma.match.findMany({ orderBy: { matchNumber: "asc" } });

  for (const match of matches) {
    const homeScore = readInt(formData.get(`actualHome:${match.id}`));
    const awayScore = readInt(formData.get(`actualAway:${match.id}`));
    const winnerSideRaw = formData.get(`actualWinner:${match.id}`);
    const homeTeamId = String(formData.get(`homeTeam:${match.id}`) ?? "") || null;
    const awayTeamId = String(formData.get(`awayTeam:${match.id}`) ?? "") || null;

    let actualWinnerSide: PickSide | null = null;
    let actualWinnerTeamId: string | null = null;

    if (winnerSideRaw === "HOME" || winnerSideRaw === "AWAY") {
      actualWinnerSide = winnerSideRaw;
      actualWinnerTeamId = winnerSideRaw === "HOME" ? homeTeamId : awayTeamId;
    } else if (match.stage === "GROUP" && homeScore !== null && awayScore !== null) {
      actualWinnerSide = homeScore === awayScore ? null : homeScore > awayScore ? "HOME" : "AWAY";
    }

    await prisma.match.update({
      where: { id: match.id },
      data: {
        homeTeamId,
        awayTeamId,
        homeScore,
        awayScore,
        actualWinnerSide,
        actualWinnerTeamId,
        status:
          match.stage === "GROUP"
            ? homeScore !== null && awayScore !== null
              ? "FINISHED"
              : "SCHEDULED"
            : actualWinnerSide
              ? "FINISHED"
              : "SCHEDULED",
      },
    });
  }

  await recalculateScores();
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
}

export async function syncWc2026Action() {
  await requireAdmin();
  await syncWc2026Matches();
  await recalculateScores();
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}

async function recalculateScores() {
  const rules = await getScoringRules();
  const predictions = await prisma.prediction.findMany({ include: { match: true } });
  for (const prediction of predictions) {
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: { points: scorePrediction(prediction.match, prediction, rules) },
    });
  }
}

export async function saveScoringSettingsAction(formData: FormData) {
  await requireAdmin();

  const schema = z.object({
    groupExactPoints: z.coerce.number().int().min(0).max(99),
    groupOutcomePoints: z.coerce.number().int().min(0).max(99),
    knockoutAdvancePoints: z.coerce.number().int().min(0).max(99),
  });

  const parsed = schema.parse({
    groupExactPoints: formData.get("groupExactPoints"),
    groupOutcomePoints: formData.get("groupOutcomePoints"),
    knockoutAdvancePoints: formData.get("knockoutAdvancePoints"),
  });

  await prisma.scoringSettings.upsert({
    where: { id: SCORING_SETTINGS_ID },
    update: parsed,
    create: { id: SCORING_SETTINGS_ID, ...parsed },
  });

  await recalculateScores();
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/picks");
}
