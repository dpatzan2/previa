import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { UserPredictionsView } from "@/components/UserPredictionsView";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { teamName, withGuatemalaSchedule } from "@/lib/match-ui";
import { participantWhere } from "@/lib/participants";
import {
  computePhaseDeadlines,
  canViewPeerPredictionsForMatch,
  isMatchLockedForPicks,
  matchDeadlineAt,
  serializePhaseDeadlines,
} from "@/lib/phase-deadlines";
import { formatAppDateTime } from "@/lib/timezone";
import { stageOrder } from "@/lib/stages";
import type { MatchStage } from "@prisma/client";

export default async function UserPredictionsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireUser();
  const { userId } = await params;

  const [user, matches, predictions] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId, ...participantWhere },
      select: { id: true, displayName: true, username: true },
    }),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: "asc" },
    }),
    prisma.prediction.findMany({
      where: { userId },
    }),
  ]);

  if (!user) notFound();

  const phaseDeadlines = computePhaseDeadlines(matches);
  const predictionMap = Object.fromEntries(
    predictions
      .filter((item) => {
        const match = matches.find((entry) => entry.id === item.matchId);
        if (!match) return false;
        return canViewPeerPredictionsForMatch(match, phaseDeadlines);
      })
      .map((item) => [
        item.matchId,
        {
          predictedHomeScore: item.predictedHomeScore,
          predictedAwayScore: item.predictedAwayScore,
          predictedWinnerSide: item.predictedWinnerSide,
          points: item.points,
        },
      ]),
  );

  const displayMatches = matches.map((match) => {
    const pickDeadline = matchDeadlineAt(match);
    return withGuatemalaSchedule({
      id: match.id,
      matchNumber: match.matchNumber,
      stage: match.stage,
      groupCode: match.groupCode,
      dateLabel: match.dateLabel,
      timeLabel: match.timeLabel,
      kickoffAt: match.kickoffAt,
      venue: match.venue,
      venueShort: match.venueShort,
      locked: isMatchLockedForPicks(match, phaseDeadlines),
      peerPicksVisible: canViewPeerPredictionsForMatch(match, phaseDeadlines),
      pickDeadlineLabel: match.stage === "GROUP" || !pickDeadline ? null : formatAppDateTime(pickDeadline),
      home: teamName(match.homeTeam, match.homePlaceholder, "Local"),
      away: teamName(match.awayTeam, match.awayPlaceholder, "Visitante"),
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      actualWinnerSide: match.actualWinnerSide,
    });
  });

  const groupCodes = Array.from(
    new Set(
      displayMatches
        .filter((match) => match.stage === "GROUP")
        .map((match) => match.groupCode)
        .filter(Boolean),
    ),
  ).sort() as string[];

  const stages = stageOrder.filter((stage) =>
    displayMatches.some((match) => match.stage === stage),
  ) as MatchStage[];

  const points = predictions.reduce((sum, prediction) => sum + prediction.points, 0);

  return (
    <div className="page">
      <header className="page-header detail-header">
        <div>
          <Link className="back-link" href="/leaderboard">
            <ArrowLeft size={17} />
            Tabla
          </Link>
          <span className="eyebrow">Predicciones</span>
          <h1>{user.displayName}</h1>
        </div>
        <div className="detail-score">
          <span>Total</span>
          <strong>{points} pts</strong>
        </div>
      </header>

      <UserPredictionsView
        matches={displayMatches}
        predictions={predictionMap}
        groupCodes={groupCodes}
        stages={stages}
        phaseDeadlines={serializePhaseDeadlines(phaseDeadlines)}
      />
    </div>
  );
}
