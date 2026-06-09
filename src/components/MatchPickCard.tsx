"use client";

import { ChevronDown, Lock } from "lucide-react";
import { useState } from "react";
import {
  GroupMatchScoreboard,
  KnockoutMatchScoreboard,
} from "@/components/MatchScoreboard";
import { TeamLabel } from "@/components/TeamLabel";
import type { DisplayMatch, DisplayPrediction, PeerPrediction } from "@/lib/match-ui";

function peerPickLabel(match: DisplayMatch, peer: PeerPrediction) {
  if (match.stage === "GROUP") {
    const home = peer.predictedHomeScore;
    const away = peer.predictedAwayScore;
    if (home === null || away === null) return "Sin pick";
    return `${home} : ${away}`;
  }

  const name =
    peer.pickedTeamName ??
    (peer.predictedWinnerSide === "HOME"
      ? match.home
      : peer.predictedWinnerSide === "AWAY"
        ? match.away
        : null);

  return name ?? "Sin pick";
}

export function MatchPickCard({
  match,
  prediction,
  peers,
  peerPicksVisible = true,
  phaseStartsLabel,
  hidden = false,
}: {
  match: DisplayMatch;
  prediction?: DisplayPrediction;
  peers: PeerPrediction[];
  peerPicksVisible?: boolean;
  phaseStartsLabel?: string;
  hidden?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (hidden) {
    return (
      <div className="match-pick-card is-hidden" aria-hidden="true">
        {match.stage === "GROUP" ? (
          <GroupMatchScoreboard match={match} prediction={prediction} />
        ) : (
          <KnockoutMatchScoreboard match={match} prediction={prediction} />
        )}
      </div>
    );
  }

  return (
    <div className={`match-pick-card${open ? " open" : ""}`}>
      <div className="match-pick-row">
        <div className="match-pick-main">
          {match.stage === "GROUP" ? (
            <GroupMatchScoreboard match={match} prediction={prediction} nested />
          ) : (
            <KnockoutMatchScoreboard match={match} prediction={prediction} nested />
          )}
        </div>
        <button
          type="button"
          className={`peer-toggle${peerPicksVisible ? "" : " locked"}`}
          aria-expanded={open}
          aria-disabled={!peerPicksVisible}
          disabled={!peerPicksVisible}
          aria-label={
            peerPicksVisible
              ? `Ver pronosticos de otros participantes, partido ${match.matchNumber}`
              : `Pronosticos de otros disponibles al iniciar la fase, partido ${match.matchNumber}`
          }
          title={
            peerPicksVisible
              ? undefined
              : `Disponible cuando inicie la fase${phaseStartsLabel ? ` (${phaseStartsLabel} GT)` : ""}`
          }
          onClick={() => {
            if (!peerPicksVisible) return;
            setOpen((value) => !value);
          }}
        >
          {peerPicksVisible ? (
            <>
              <ChevronDown size={18} className="peer-toggle-icon" aria-hidden="true" />
              <span className="peer-toggle-count">{peers.length}</span>
            </>
          ) : (
            <Lock size={16} aria-hidden="true" />
          )}
        </button>
      </div>

      {open && peerPicksVisible ? (
        <div className="peer-picks-panel">
          <div className="peer-picks-head">
            <strong>Pronosticos del grupo</strong>
            <span>{peers.length} participantes</span>
          </div>
          {peers.length > 0 ? (
            <ul className="peer-picks-list">
              {peers.map((peer) => (
                <li className="peer-pick-row" key={peer.userId}>
                  <span className="peer-pick-name">{peer.displayName}</span>
                  <span className="peer-pick-value">
                    {match.stage === "GROUP" ? (
                      peerPickLabel(match, peer)
                    ) : peer.pickedTeamName ||
                      (peer.predictedWinnerSide === "HOME"
                        ? match.home
                        : peer.predictedWinnerSide === "AWAY"
                          ? match.away
                          : null) ? (
                      <TeamLabel
                        name={
                          peer.pickedTeamName ??
                          (peer.predictedWinnerSide === "HOME" ? match.home : match.away)
                        }
                        compact
                      />
                    ) : (
                      <span className="muted">Sin pick</span>
                    )}
                  </span>
                  <span className="points-pill compact">{peer.points} pts</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="peer-picks-empty muted">Nadie mas ha pronosticado este partido.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
