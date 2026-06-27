"use server";

import { Role, type PickSide } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { signIn, signOut, requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canParticipateInPool } from "@/lib/participants";
import { computePhaseDeadlines, isMatchLockedForPicks } from "@/lib/phase-deadlines";
import { scorePrediction } from "@/lib/scoring";
import { getScoringRules, SCORING_SETTINGS_ID } from "@/lib/scoring-settings";
import { syncWc2026Matches } from "@/lib/wc2026";
import type { ActionFeedbackState } from "@/lib/form-action-state";
import { safeRedirectPath } from "@/lib/session-cookie";

function readInt(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export type SavePredictionsState = ActionFeedbackState;

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""));
  const ok = await signIn(username, password);
  if (!ok) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
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

export async function savePredictionsAction(
  _prevState: SavePredictionsState | null,
  formData: FormData,
): Promise<SavePredictionsState> {
  try {
    const user = await requireUser();
    if (!canParticipateInPool(user)) {
      return {
        ok: false,
        message: "Tu cuenta no puede participar en la quiniela.",
      };
    }

    const matches = await prisma.match.findMany({
      orderBy: { matchNumber: "asc" },
    });
    const phaseDeadlines = computePhaseDeadlines(matches);

    for (const match of matches) {
      if (isMatchLockedForPicks(match, phaseDeadlines)) continue;

      const predictedHomeScore = readInt(formData.get(`homeScore:${match.id}`));
      const predictedAwayScore = readInt(formData.get(`awayScore:${match.id}`));
      const side = formData.get(`winnerSide:${match.id}`);
      const predictedWinnerSide =
        predictedHomeScore !== null && predictedAwayScore !== null
          ? predictedHomeScore > predictedAwayScore
            ? "HOME"
            : predictedAwayScore > predictedHomeScore
              ? "AWAY"
              : side === "HOME" || side === "AWAY"
                ? side
                : null
          : null;

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
      } else if (
        predictedHomeScore !== null &&
        predictedAwayScore !== null &&
        predictedWinnerSide
      ) {
        const teamId = predictedWinnerSide === "HOME" ? match.homeTeamId : match.awayTeamId;
        await prisma.prediction.upsert({
          where: { userId_matchId: { userId: user.id, matchId: match.id } },
          update: {
            predictedHomeScore,
            predictedAwayScore,
            predictedWinnerSide,
            predictedWinnerTeamId: teamId,
            points: 0,
          },
          create: {
            userId: user.id,
            matchId: match.id,
            predictedHomeScore,
            predictedAwayScore,
            predictedWinnerSide,
            predictedWinnerTeamId: teamId,
          },
        });
      }
    }

    await recalculateScores();
    revalidatePath("/picks");
    revalidatePath("/leaderboard");

    return {
      ok: true,
      message: "Pronosticos guardados correctamente.",
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("savePredictionsAction failed", error);
    return {
      ok: false,
      message: "No se pudieron guardar los pronosticos. Intenta de nuevo.",
    };
  }
}

export async function createUserAction(
  _prevState: ActionFeedbackState | null,
  formData: FormData,
): Promise<ActionFeedbackState> {
  try {
    await requireAdmin();

    const schema = z.object({
      username: z.string().trim().min(3).max(40),
      displayName: z.string().trim().min(2).max(80),
      password: z.string().min(6),
      role: z.enum(["ADMIN", "PLAYER"]),
    });

    const parsed = schema.safeParse({
      username: String(formData.get("username") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "PLAYER"),
    });

    if (!parsed.success) {
      return {
        ok: false,
        message: "Revisa los datos del nuevo usuario.",
      };
    }

    const existing = await prisma.user.findUnique({
      where: { username: parsed.data.username },
    });

    if (existing) {
      return {
        ok: false,
        message: "Ese nombre de usuario ya existe.",
      };
    }

    await prisma.user.create({
      data: {
        username: parsed.data.username,
        displayName: parsed.data.displayName,
        role: parsed.data.role as Role,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
      },
    });

    revalidatePath("/admin");

    return {
      ok: true,
      message: "Usuario creado correctamente.",
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("createUserAction failed", error);
    return {
      ok: false,
      message: "No se pudo crear el usuario. Intenta de nuevo.",
    };
  }
}

export async function deleteUserAction(
  _prevState: ActionFeedbackState | null,
  formData: FormData,
): Promise<ActionFeedbackState> {
  try {
    const admin = await requireAdmin();
    const userId = String(formData.get("userId") ?? "").trim();

    if (!userId) {
      return {
        ok: false,
        message: "No se pudo eliminar el usuario.",
      };
    }

    if (userId === admin.id) {
      return {
        ok: false,
        message: "No puedes eliminar tu propia cuenta.",
      };
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return {
        ok: false,
        message: "Ese usuario ya no existe.",
      };
    }

    if (target.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        return {
          ok: false,
          message: "No puedes eliminar al unico administrador.",
        };
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/admin");
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: `${target.displayName} fue eliminado.`,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("deleteUserAction failed", error);
    return {
      ok: false,
      message: "No se pudo eliminar el usuario. Intenta de nuevo.",
    };
  }
}

export async function saveResultsAction(
  _prevState: ActionFeedbackState | null,
  formData: FormData,
): Promise<ActionFeedbackState> {
  try {
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

    return {
      ok: true,
      message: "Resultados guardados correctamente.",
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("saveResultsAction failed", error);
    return {
      ok: false,
      message: "No se pudieron guardar los resultados. Intenta de nuevo.",
    };
  }
}

export async function syncWc2026Action(
  _prevState: ActionFeedbackState | null,
): Promise<ActionFeedbackState> {
  try {
    await requireAdmin();
    await syncWc2026Matches();
    await recalculateScores();
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/leaderboard");

    return {
      ok: true,
      message: "Partidos sincronizados desde la API.",
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("syncWc2026Action failed", error);
    return {
      ok: false,
      message: "No se pudo sincronizar la API. Intenta de nuevo.",
    };
  }
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

export async function saveScoringSettingsAction(
  _prevState: ActionFeedbackState | null,
  formData: FormData,
): Promise<ActionFeedbackState> {
  try {
    await requireAdmin();

    const schema = z.object({
      groupExactPoints: z.coerce.number().int().min(0).max(99),
      groupOutcomePoints: z.coerce.number().int().min(0).max(99),
      knockoutAdvancePoints: z.coerce.number().int().min(0).max(99),
    });

    const parsed = schema.safeParse({
      groupExactPoints: formData.get("groupExactPoints"),
      groupOutcomePoints: formData.get("groupOutcomePoints"),
      knockoutAdvancePoints: formData.get("knockoutAdvancePoints"),
    });

    if (!parsed.success) {
      return {
        ok: false,
        message: "Revisa los valores de puntuacion.",
      };
    }

    await prisma.scoringSettings.upsert({
      where: { id: SCORING_SETTINGS_ID },
      update: parsed.data,
      create: { id: SCORING_SETTINGS_ID, ...parsed.data },
    });

    await recalculateScores();
    revalidatePath("/admin");
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    revalidatePath("/picks");

    return {
      ok: true,
      message: "Reglas de puntuacion guardadas correctamente.",
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("saveScoringSettingsAction failed", error);
    return {
      ok: false,
      message: "No se pudieron guardar las reglas. Intenta de nuevo.",
    };
  }
}
