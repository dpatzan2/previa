import { PicksForm } from "@/components/PicksForm";
import { requireParticipant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { teamName, withGuatemalaSchedule } from "@/lib/match-ui";
import type { PeerPrediction } from "@/lib/match-ui";
import {
  canViewPeerPredictionsForMatch,
  computePhaseDeadlines,
  isMatchLockedForPicks,
  serializePhaseDeadlines,
} from "@/lib/phase-deadlines";
import { participantWhere } from "@/lib/participants";
import { stageOrder } from "@/lib/stages";
import type { MatchStage } from "@prisma/client";

export default async function PicksPage() {
  const user = await requireParticipant();
  const [matches, predictions, peerPredictions] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: "asc" },
    }),
    prisma.prediction.findMany({ where: { userId: user.id } }),
    prisma.prediction.findMany({
      where: {
        userId: { not: user.id },
        user: participantWhere,
      },
      include: {
        user: { select: { displayName: true } },
        predictedWinnerTeam: { select: { name: true } },
      },
      orderBy: { user: { displayName: "asc" } },
    }),
  ]);

  const phaseDeadlines = computePhaseDeadlines(matches);
  const matchById = new Map(matches.map((match) => [match.id, match]));
  const predictionMap = Object.fromEntries(
    predictions.map((item) => [
      item.matchId,
      {
        predictedHomeScore: item.predictedHomeScore,
        predictedAwayScore: item.predictedAwayScore,
        predictedWinnerSide: item.predictedWinnerSide,
        points: item.points,
      },
    ]),
  );

  const peersByMatch: Record<string, PeerPrediction[]> = {};
  for (const item of peerPredictions) {
    const match = matchById.get(item.matchId);
    if (!match) continue;

    if (!canViewPeerPredictionsForMatch(match, phaseDeadlines)) continue;

    const peer: PeerPrediction = {
      userId: item.userId,
      displayName: item.user.displayName,
      predictedHomeScore: item.predictedHomeScore,
      predictedAwayScore: item.predictedAwayScore,
      predictedWinnerSide: item.predictedWinnerSide,
      pickedTeamName: item.predictedWinnerTeam?.name ?? null,
      points: item.points,
    };
    if (!peersByMatch[item.matchId]) peersByMatch[item.matchId] = [];
    peersByMatch[item.matchId].push(peer);
  }

  const displayMatches = matches.map((match) =>
    withGuatemalaSchedule({
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
      home: teamName(match.homeTeam, match.homePlaceholder, "Local"),
      away: teamName(match.awayTeam, match.awayPlaceholder, "Visitante"),
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      actualWinnerSide: match.actualWinnerSide,
    }),
  );

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

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Mis picks</span>
          <h1>Pronosticos</h1>
        </div>
      </header>
      <PicksForm
        matches={displayMatches}
        predictions={predictionMap}
        peersByMatch={peersByMatch}
        groupCodes={groupCodes}
        stages={stages}
        phaseDeadlines={serializePhaseDeadlines(phaseDeadlines)}
      />
    </div>
  );
}
