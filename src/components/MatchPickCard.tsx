"use client";

import { ChevronDown, Lock } from "lucide-react";
import { useState } from "react";
import {
  GroupMatchScoreboard,
  KnockoutMatchScoreboard,
} from "@/components/MatchScoreboard";
import type { DisplayMatch, DisplayPrediction, PeerPrediction } from "@/lib/match-ui";

function peerPickLabel(match: DisplayMatch, peer: PeerPrediction) {
  const home = peer.predictedHomeScore;
  const away = peer.predictedAwayScore;

  if (match.stage === "GROUP") {
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

  const score = home === null || away === null ? null : `${home} : ${away}`;
  if (score && name) return `${score} · ${name}`;
  return score ?? name ?? "Sin pick";
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
  const showPeerPanel = open && peerPicksVisible && !hidden;

  return (
    <div
      className={`match-pick-card${showPeerPanel ? " open" : ""}${hidden ? " is-hidden" : ""}`}
      aria-hidden={hidden}
    >
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
          aria-expanded={showPeerPanel}
          aria-disabled={!peerPicksVisible}
          disabled={!peerPicksVisible || hidden}
          tabIndex={hidden ? -1 : undefined}
          aria-label={
            peerPicksVisible
              ? `Ver pronosticos de otros participantes, partido ${match.matchNumber}`
              : `Pronosticos de otros disponibles al cierre del partido ${match.matchNumber}`
          }
          title={
            peerPicksVisible
              ? undefined
              : `Disponible cuando cierre el partido${phaseStartsLabel ? ` de la fase iniciada el ${phaseStartsLabel} GT` : ""}`
          }
          onClick={() => {
            if (!peerPicksVisible || hidden) return;
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

      {showPeerPanel ? (
        <div className="peer-picks-panel">
          <div className="peer-picks-head">
            <strong>Pronosticos del grupo</strong>
            <span>{peers.length} participantes</span>
          </div>
          {peers.length > 0 ? (
            <ul className="peer-picks-list">
              {peers.map((peer) => {
                const pickLabel = peerPickLabel(match, peer);

                return (
                  <li className="peer-pick-row" key={peer.userId}>
                    <span className="peer-pick-name">{peer.displayName}</span>
                    <span className="peer-pick-value">
                      {pickLabel === "Sin pick" ? (
                        <span className="muted">Sin pick</span>
                      ) : (
                        pickLabel
                      )}
                    </span>
                    <span className="points-pill compact">{peer.points} pts</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="peer-picks-empty muted">Nadie mas ha pronosticado este partido.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
