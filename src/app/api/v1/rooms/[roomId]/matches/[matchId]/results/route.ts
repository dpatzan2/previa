import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRoomMembership } from "@/lib/rooms";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string; matchId: string }> },
) {
  const user = await requireUser();
  const { roomId, matchId } = await params;
  await requireRoomMembership(roomId, user.id);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, status: true, homeScore: true, awayScore: true, updatedAt: true },
  });
  if (!match) return NextResponse.json({ error: "MATCH_NOT_FOUND" }, { status: 404 });
  if (match.status !== "FINISHED") {
    return NextResponse.json({ error: "MATCH_NOT_FINISHED" }, { status: 409 });
  }

  const [members, predictions, bonusAnswers] = await Promise.all([
    prisma.roomMember.findMany({
      where: { roomId },
      select: { userId: true, user: { select: { displayName: true } } },
    }),
    prisma.prediction.findMany({
      where: { roomId, matchId },
      select: { userId: true, points: true },
    }),
    prisma.predictionAnswer.groupBy({
      by: ["userId"],
      where: { roomId, matchId },
      _sum: { points: true },
    }),
  ]);
  const baseByUser = new Map(predictions.map((prediction) => [prediction.userId, prediction.points]));
  const bonusByUser = new Map(
    bonusAnswers.map((answer) => [answer.userId, answer._sum.points ?? 0]),
  );

  const entries = members
    .map((member) => ({
      userId: member.userId,
      displayName: member.user.displayName,
      basePoints: baseByUser.get(member.userId) ?? 0,
      bonusPoints: bonusByUser.get(member.userId) ?? 0,
      totalPoints: (baseByUser.get(member.userId) ?? 0) + (bonusByUser.get(member.userId) ?? 0),
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.displayName.localeCompare(right.displayName));

  return NextResponse.json(
    { roomId, match, entries },
    { headers: { "Cache-Control": "private, max-age=2" } },
  );
}
