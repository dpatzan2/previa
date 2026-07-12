import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRoomMembership } from "@/lib/rooms";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const user = await requireUser();
  const { roomId } = await params;
  await requireRoomMembership(roomId, user.id);

  const url = new URL(request.url);
  const requestedLimit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
  const cursor = url.searchParams.get("cursor");

  const entries = await prisma.roomLeaderboardEntry.findMany({
    where: { roomId },
    include: { user: { select: { displayName: true } } },
    orderBy: [{ totalPoints: "desc" }, { predictionCount: "desc" }, { userId: "asc" }],
    take: limit + 1,
    ...(cursor
      ? { cursor: { roomId_userId: { roomId, userId: cursor } }, skip: 1 }
      : {}),
  });
  const hasMore = entries.length > limit;
  const page = hasMore ? entries.slice(0, limit) : entries;

  return NextResponse.json(
    {
      roomId,
      entries: page.map((entry, index) => ({
        position: index + 1,
        userId: entry.userId,
        displayName: entry.user.displayName,
        totalPoints: entry.totalPoints,
        predictionCount: entry.predictionCount,
        updatedAt: entry.updatedAt,
      })),
      nextCursor: hasMore ? page.at(-1)?.userId ?? null : null,
    },
    { headers: { "Cache-Control": "private, no-cache" } },
  );
}
