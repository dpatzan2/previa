"use client";

import { useState } from "react";
import { RoomMarketFields } from "@/components/RoomMarketFields";
import { TeamLabel } from "@/components/TeamLabel";
import type { DisplayMatch, TeamOption } from "@/lib/match-ui";
import type { RoomMarketKey } from "@/lib/room-presets";

type MarketAnswerValue = Record<string, unknown>;

function teamLabelFor(id: string | null, teams: TeamOption[], fallback: string) {
  if (!id) return fallback;
  return teams.find((team) => team.id === id)?.name ?? fallback;
}

export function AdminMatchScoreboard({
  match,
  teams,
  bonusMarkets,
  marketResults,
  hidden = false,
}: {
  match: DisplayMatch;
  teams: TeamOption[];
  bonusMarkets: RoomMarketKey[];
  marketResults: Partial<Record<RoomMarketKey, MarketAnswerValue>>;
  hidden?: boolean;
}) {
  const [homeTeamId, setHomeTeamId] = useState(match.homeTeamId ?? "");
  const [awayTeamId, setAwayTeamId] = useState(match.awayTeamId ?? "");

  const homeName = teamLabelFor(homeTeamId || null, teams, match.home);
  const awayName = teamLabelFor(awayTeamId || null, teams, match.away);

  return (
    <article className={`scoreboard-card admin${hidden ? " is-hidden" : ""}`} aria-hidden={hidden}>
      <header className="scoreboard-head">
        <div className="scoreboard-meta">
          <span className="scoreboard-badge">P{match.matchNumber}</span>
          {match.dateLabel ? <span>{match.dateLabel}</span> : null}
          {match.timeLabel ? <span>{match.timeLabel}</span> : null}
        </div>
        {match.stage === "GROUP" ? (
          <span className="scoreboard-note">Resultado por marcador</span>
        ) : (
          <span className="scoreboard-note">Elige quien pasa</span>
        )}
      </header>

      {(match.venueShort ?? match.venue) ? (
        <p className="scoreboard-venue">{match.venueShort ?? match.venue}</p>
      ) : null}

      <div className="scoreboard-body admin-body">
        <div className="scoreboard-side home">
          <TeamLabel name={homeName} />
          <select
            name={`homeTeam:${match.id}`}
            value={homeTeamId}
            onChange={(event) => setHomeTeamId(event.target.value)}
            aria-label={`Local partido ${match.matchNumber}`}
          >
            <option value="">{match.home}</option>
            {teams.map((team) => (
              <option value={team.id} key={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="scoreboard-center">
          <input
            name={`actualHome:${match.id}`}
            type="number"
            min="0"
            className="scoreboard-input"
            defaultValue={match.homeScore ?? ""}
            aria-label={`Goles local partido ${match.matchNumber}`}
          />
          <span className="scoreboard-sep">:</span>
          <input
            name={`actualAway:${match.id}`}
            type="number"
            min="0"
            className="scoreboard-input"
            defaultValue={match.awayScore ?? ""}
            aria-label={`Goles visitante partido ${match.matchNumber}`}
          />
        </div>

        <div className="scoreboard-side away">
          <TeamLabel name={awayName} />
          <select
            name={`awayTeam:${match.id}`}
            value={awayTeamId}
            onChange={(event) => setAwayTeamId(event.target.value)}
            aria-label={`Visitante partido ${match.matchNumber}`}
          >
            <option value="">{match.away}</option>
            {teams.map((team) => (
              <option value={team.id} key={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {match.stage !== "GROUP" ? (
        <div className="admin-winner-row">
          <select
            name={`actualWinner:${match.id}`}
            defaultValue={match.actualWinnerSide ?? ""}
            aria-label={`Ganador partido ${match.matchNumber}`}
          >
            <option value="">Ganador del cruce</option>
            <option value="HOME">{homeName} pasa</option>
            <option value="AWAY">{awayName} pasa</option>
          </select>
        </div>
      ) : null}

      {bonusMarkets.length > 0 ? (
        <details className="admin-market-results">
          <summary>Resultados bonus</summary>
          <RoomMarketFields match={match} markets={bonusMarkets} answers={marketResults} />
        </details>
      ) : null}
    </article>
  );
}
