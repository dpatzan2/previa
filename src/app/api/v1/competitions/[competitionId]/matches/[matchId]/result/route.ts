import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ competitionId: string; matchId: string }> },
) {
  const { competitionId, matchId } = await params;
  const match = await prisma.competitionMatch.findFirst({
    where: { id: matchId, competitionId },
    include: {
      competition: { select: { id: true, name: true, slug: true } },
      phase: { select: { id: true, name: true, stage: true } },
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "MATCH_NOT_FOUND" }, { status: 404 });
  }

  const marketResults = await prisma.matchMarketResult.findMany({
    where: { matchId },
    select: { marketKey: true, value: true, updatedAt: true },
    orderBy: { marketKey: "asc" },
  });

  return NextResponse.json(
    {
      competition: match.competition,
      match: {
        id: match.id,
        matchNumber: match.matchNumber,
        phase: match.phase,
        status: match.status,
        kickoffAt: match.kickoffAt,
        home: match.homeTeam ?? { id: null, name: match.homePlaceholder ?? "Local" },
        away: match.awayTeam ?? { id: null, name: match.awayPlaceholder ?? "Visitante" },
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        updatedAt: match.updatedAt,
      },
      bonusResults: marketResults,
    },
    { headers: { "Cache-Control": "private, max-age=2, stale-while-revalidate=5" } },
  );
}
