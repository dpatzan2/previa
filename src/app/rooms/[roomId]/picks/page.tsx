import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PicksForm } from "@/components/PicksForm";
import { RoomHeader } from "@/components/RoomHeader";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { teamName, withGuatemalaSchedule } from "@/lib/match-ui";
import type { PeerPrediction } from "@/lib/match-ui";
import {
  canViewPeerPredictionsForMatch,
  computePhaseDeadlines,
  isMatchLockedForPicks,
  matchDeadlineAt,
  roomDeadlineConfig,
  serializePhaseDeadlines,
} from "@/lib/phase-deadlines";
import { requireRoomMembership } from "@/lib/rooms";
import { bonusMarketsFor, parseEnabledMarkets, type RoomMarketKey } from "@/lib/room-presets";
import { stageOrder } from "@/lib/stages";
import { formatAppDateTime } from "@/lib/timezone";
import type { MatchStage } from "@prisma/client";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export default async function RoomPicksPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const user = await requireUser();
  const { roomId } = await params;
  const { room, membership } = await requireRoomMembership(roomId, user.id);
  const canManage = membership.role === "OWNER" || membership.role === "ADMIN";
  const memberIds = room.members.map((member) => member.userId);
  const roomMarkets = bonusMarketsFor(parseEnabledMarkets(room.ruleSet?.enabledMarkets));
  const deadlineConfig = roomDeadlineConfig(room);

  // Auto-healing logic: link existing rooms to competition by matching name if externalTournamentId is null
  let competitionId = room.externalTournamentId;
  if (!competitionId && room.tournamentName) {
    const matchingComp = await prisma.competition.findFirst({
      where: { name: room.tournamentName },
      select: { id: true },
    });
    if (matchingComp) {
      competitionId = matchingComp.id;
      await prisma.room.update({
        where: { id: room.id },
        data: { externalTournamentId: competitionId },
      });
    }
  }

  // Fetch competition matches if linked
  let compMatches: any[] = [];
  if (competitionId) {
    compMatches = await prisma.competitionMatch.findMany({
      where: { competitionId },
      include: { phase: true, homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: "asc" },
    });

    // 1. Bulk fetch existing legacy matches to check if we can bypass the sync loop entirely
    const compMatchIds = compMatches.map((m) => m.id);
    const existingLegacyMatches = await prisma.match.findMany({
      where: { id: { in: compMatchIds } },
      select: { id: true, status: true, homeScore: true, awayScore: true },
    });
    const existingLegacyMatchMap = new Map(existingLegacyMatches.map((m) => [m.id, m]));

    // We only need to sync matches that:
    // a) Do not exist in the legacy table
    // b) Have a different status or different scores (updated by admin)
    const matchesToSync = compMatches.filter((cm) => {
      const lm = existingLegacyMatchMap.get(cm.id);
      if (!lm) return true;
      return lm.status !== cm.status || lm.homeScore !== cm.homeScore || lm.awayScore !== cm.awayScore;
    });

    if (matchesToSync.length > 0) {
      // Collect all unique team names to upsert them in bulk
      const uniqueTeamNames = new Set<string>();
      for (const cm of matchesToSync) {
        if (cm.homeTeam) uniqueTeamNames.add(cm.homeTeam.name);
        if (cm.awayTeam) uniqueTeamNames.add(cm.awayTeam.name);
      }

      // Fetch existing global teams
      const existingGlobalTeams = await prisma.team.findMany({
        where: {
          OR: [
            { name: { in: Array.from(uniqueTeamNames) } },
            { normalizedName: { in: Array.from(uniqueTeamNames).map(normalizeText) } },
          ],
        },
      });
      const globalTeamByName = new Map(
        existingGlobalTeams.map((t) => [t.normalizedName, t])
      );

      // Bulk create missing global teams
      const teamsToCreate = [];
      for (const name of uniqueTeamNames) {
        const norm = normalizeText(name);
        if (!globalTeamByName.has(norm)) {
          teamsToCreate.push({
            name,
            normalizedName: norm,
          });
        }
      }

      if (teamsToCreate.length > 0) {
        await prisma.team.createMany({
          data: teamsToCreate,
          skipDuplicates: true,
        });
        const newlyCreatedTeams = await prisma.team.findMany({
          where: { normalizedName: { in: teamsToCreate.map((t) => t.normalizedName) } },
        });
        for (const t of newlyCreatedTeams) {
          globalTeamByName.set(t.normalizedName, t);
        }
      }

      const getGlobalTeamId = (compTeam: any) => {
        if (!compTeam) return null;
        const norm = normalizeText(compTeam.name);
        return globalTeamByName.get(norm)?.id ?? null;
      };

      const matchesToCreate = [];
      const matchesToUpdate = [];

      for (const compMatch of matchesToSync) {
        const lm = existingLegacyMatchMap.get(compMatch.id);
        if (!lm) {
          matchesToCreate.push(compMatch);
        } else {
          matchesToUpdate.push(compMatch);
        }
      }

      // Sync inserts (createMany in bulk)
      if (matchesToCreate.length > 0) {
        const maxLegacyMatch = await prisma.match.findFirst({
          orderBy: { matchNumber: "desc" },
          select: { matchNumber: true },
        });
        let nextLegacyMatchNumber = (maxLegacyMatch?.matchNumber ?? 0) + 1;

        const createData = matchesToCreate.map((compMatch) => {
          const legacyMatchNumber = nextLegacyMatchNumber++;
          const mappedGroupCode = compMatch.phase?.groupCode || compMatch.phase?.name || null;
          const mappedStage = compMatch.phase?.stage ?? "GROUP";

          return {
            id: compMatch.id,
            matchNumber: legacyMatchNumber,
            stage: mappedStage,
            groupCode: mappedGroupCode,
            kickoffAt: compMatch.kickoffAt,
            venue: compMatch.venue,
            homeTeamId: getGlobalTeamId(compMatch.homeTeam),
            awayTeamId: getGlobalTeamId(compMatch.awayTeam),
            homePlaceholder: compMatch.homePlaceholder,
            awayPlaceholder: compMatch.awayPlaceholder,
            homeScore: compMatch.homeScore,
            awayScore: compMatch.awayScore,
            status: compMatch.status,
          };
        });

        await prisma.match.createMany({
          data: createData,
          skipDuplicates: true,
        });
      }

      // Sync updates (in transaction)
      if (matchesToUpdate.length > 0) {
        await prisma.$transaction(
          matchesToUpdate.map((compMatch) => {
            const mappedGroupCode = compMatch.phase?.groupCode || compMatch.phase?.name || null;
            const mappedStage = compMatch.phase?.stage ?? "GROUP";

            return prisma.match.update({
              where: { id: compMatch.id },
              data: {
                stage: mappedStage,
                groupCode: mappedGroupCode,
                kickoffAt: compMatch.kickoffAt,
                venue: compMatch.venue,
                homeTeamId: getGlobalTeamId(compMatch.homeTeam),
                awayTeamId: getGlobalTeamId(compMatch.awayTeam),
                homePlaceholder: compMatch.homePlaceholder,
                awayPlaceholder: compMatch.awayPlaceholder,
                homeScore: compMatch.homeScore,
                awayScore: compMatch.awayScore,
                status: compMatch.status,
              },
            });
          })
        );
      }
    }
  }

  const matchFilter = competitionId
    ? { id: { in: compMatches.map((m) => m.id) } }
    : {};

  const [matches, predictions, peerPredictions, predictionAnswers] = await Promise.all([
    prisma.match.findMany({
      where: matchFilter,
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: "asc" },
    }),
    prisma.prediction.findMany({
      where: { userId: user.id, roomId },
      select: {
        matchId: true,
        predictedHomeScore: true,
        predictedAwayScore: true,
        predictedWinnerSide: true,
        points: true,
      },
    }),
    prisma.prediction.findMany({
      where: {
        roomId,
        userId: { in: memberIds.filter((id) => id !== user.id) },
      },
      select: {
        userId: true,
        matchId: true,
        predictedHomeScore: true,
        predictedAwayScore: true,
        predictedWinnerSide: true,
        points: true,
        user: { select: { displayName: true } },
        predictedWinnerTeam: { select: { name: true } },
      },
      orderBy: { user: { displayName: "asc" } },
    }),
    prisma.predictionAnswer.findMany({
      where: {
        roomId,
        userId: user.id,
        marketKey: { in: roomMarkets },
      },
    }),
  ]);

  const phaseDeadlines = computePhaseDeadlines(matches, new Date(), deadlineConfig);
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
    if (!canViewPeerPredictionsForMatch(match, phaseDeadlines, new Date(), deadlineConfig)) continue;

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

  const marketAnswers: Record<string, Partial<Record<RoomMarketKey, Record<string, unknown>>>> = {};
  for (const answer of predictionAnswers) {
    if (!marketAnswers[answer.matchId]) marketAnswers[answer.matchId] = {};
    marketAnswers[answer.matchId][answer.marketKey as RoomMarketKey] =
      answer.value && typeof answer.value === "object" && !Array.isArray(answer.value)
        ? (answer.value as Record<string, unknown>)
        : {};
  }

  const displayMatches = matches.map((match) => {
    const pickDeadline = matchDeadlineAt(match, deadlineConfig);
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
      locked: isMatchLockedForPicks(match, phaseDeadlines, new Date(), deadlineConfig),
      peerPicksVisible: canViewPeerPredictionsForMatch(match, phaseDeadlines, new Date(), deadlineConfig),
      home: teamName(match.homeTeam, match.homePlaceholder, "Local"),
      away: teamName(match.awayTeam, match.awayPlaceholder, "Visitante"),
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      actualWinnerSide: match.actualWinnerSide,
      pickDeadlineLabel:
        match.stage === "GROUP" || !pickDeadline ? null : formatAppDateTime(pickDeadline),
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

  return (
    <div className="page">
      <Link className="back-link" href="/rooms">
        <ArrowLeft size={16} />
        Volver a salas
      </Link>
      <RoomHeader
        roomId={room.id}
        roomName={room.name}
        accessCode={room.accessCode}
        activeTab="picks"
        canManage={canManage}
      />
      <PicksForm
        roomId={room.id}
        matches={displayMatches}
        predictions={predictionMap}
        peersByMatch={peersByMatch}
        groupCodes={groupCodes}
        stages={stages}
        phaseDeadlines={serializePhaseDeadlines(phaseDeadlines)}
        roomMarkets={roomMarkets}
        marketAnswers={marketAnswers}
        deadlineMode={deadlineConfig.mode}
        deadlineHoursBefore={deadlineConfig.hoursBefore}
      />
    </div>
  );
}
