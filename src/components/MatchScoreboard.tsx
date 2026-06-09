import { Lock } from "lucide-react";
import { TeamLabel } from "@/components/TeamLabel";
import type { DisplayMatch, DisplayPrediction } from "@/lib/match-ui";

function scoreText(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : String(value);
}

export function GroupMatchScoreboard({
  match,
  prediction,
  hidden = false,
  readOnly = false,
  nested = false,
  predictionHidden = false,
}: {
  match: DisplayMatch;
  prediction?: DisplayPrediction;
  hidden?: boolean;
  readOnly?: boolean;
  nested?: boolean;
  predictionHidden?: boolean;
}) {
  const displayOnly = readOnly || match.locked;

  return (
    <article
      className={`scoreboard-card${displayOnly ? " locked" : ""}${nested ? " nested" : ""}${hidden ? " is-hidden" : ""}${predictionHidden ? " prediction-hidden-card" : ""}`}
      aria-hidden={hidden}
    >
      <header className="scoreboard-head">
        <div className="scoreboard-meta">
          <span className="scoreboard-badge">P{match.matchNumber}</span>
          {match.dateLabel ? <span>{match.dateLabel}</span> : null}
          {match.timeLabel ? <span>{match.timeLabel}</span> : null}
        </div>
        <div className="scoreboard-head-right">
          {!readOnly && match.locked ? (
            <span className="scoreboard-lock">
              <Lock size={14} />
              Cerrado
            </span>
          ) : null}
          {!predictionHidden ? (
            <span className="points-pill">{prediction?.points ?? 0} pts</span>
          ) : null}
        </div>
      </header>

      {(match.venueShort ?? match.venue) ? (
        <p className="scoreboard-venue">{match.venueShort ?? match.venue}</p>
      ) : null}

      <div className="scoreboard-body">
        <div className="scoreboard-side home">
          <TeamLabel name={match.home} />
        </div>

        {predictionHidden ? (
          <div className="scoreboard-center readonly prediction-hidden">
            <Lock size={16} aria-hidden="true" />
            <span>Oculto</span>
          </div>
        ) : displayOnly ? (
          <div className="scoreboard-center readonly" aria-label="Marcador registrado">
            <span className="scoreboard-score">{scoreText(prediction?.predictedHomeScore)}</span>
            <span className="scoreboard-sep">:</span>
            <span className="scoreboard-score">{scoreText(prediction?.predictedAwayScore)}</span>
          </div>
        ) : (
          <div className="scoreboard-center">
            <input
              aria-label={`${match.home} goles`}
              name={`homeScore:${match.id}`}
              type="number"
              min="0"
              className="scoreboard-input"
              defaultValue={prediction?.predictedHomeScore ?? ""}
            />
            <span className="scoreboard-sep">:</span>
            <input
              aria-label={`${match.away} goles`}
              name={`awayScore:${match.id}`}
              type="number"
              min="0"
              className="scoreboard-input"
              defaultValue={prediction?.predictedAwayScore ?? ""}
            />
          </div>
        )}

        <div className="scoreboard-side away">
          <TeamLabel name={match.away} />
        </div>
      </div>
    </article>
  );
}

export function KnockoutMatchScoreboard({
  match,
  prediction,
  hidden = false,
  readOnly = false,
  nested = false,
  predictionHidden = false,
}: {
  match: DisplayMatch;
  prediction?: DisplayPrediction;
  hidden?: boolean;
  readOnly?: boolean;
  nested?: boolean;
  predictionHidden?: boolean;
}) {
  const pickedHome = prediction?.predictedWinnerSide === "HOME";
  const pickedAway = prediction?.predictedWinnerSide === "AWAY";
  const displayOnly = readOnly || match.locked;

  return (
    <article
      className={`scoreboard-card knockout${displayOnly ? " locked" : ""}${nested ? " nested" : ""}${hidden ? " is-hidden" : ""}${predictionHidden ? " prediction-hidden-card" : ""}`}
      aria-hidden={hidden}
    >
      <header className="scoreboard-head">
        <div className="scoreboard-meta">
          <span className="scoreboard-badge">P{match.matchNumber}</span>
          {match.dateLabel ? <span>{match.dateLabel}</span> : null}
          {match.timeLabel ? <span>{match.timeLabel}</span> : null}
        </div>
        <div className="scoreboard-head-right">
          {!readOnly && match.locked ? (
            <span className="scoreboard-lock">
              <Lock size={14} />
              Cerrado
            </span>
          ) : null}
          {!predictionHidden ? (
            <span className="points-pill">{prediction?.points ?? 0} pts</span>
          ) : null}
        </div>
      </header>

      {(match.venueShort ?? match.venue) ? (
        <p className="scoreboard-venue">{match.venueShort ?? match.venue}</p>
      ) : null}

      {predictionHidden ? (
        <div className="knockout-pick-grid readonly-grid prediction-hidden-grid">
          <div className="prediction-hidden knockout-hidden-message">
            <Lock size={16} aria-hidden="true" />
            <span>Pronostico oculto hasta inicio de fase</span>
          </div>
        </div>
      ) : displayOnly ? (
        <div className="knockout-pick-grid readonly-grid">
          <div className={`knockout-option-body static${pickedHome ? " selected" : ""}`}>
            <TeamLabel name={match.home} />
            <small>{pickedHome ? "Pronostico" : "Pasa"}</small>
          </div>
          <div className={`knockout-option-body static${pickedAway ? " selected" : ""}`}>
            <TeamLabel name={match.away} />
            <small>{pickedAway ? "Pronostico" : "Pasa"}</small>
          </div>
        </div>
      ) : (
        <div className="knockout-pick-grid">
          <label className="knockout-option">
            <input
              type="radio"
              name={`winnerSide:${match.id}`}
              value="HOME"
              defaultChecked={pickedHome}
            />
            <span className="knockout-option-body">
              <TeamLabel name={match.home} />
              <small>Pasa</small>
            </span>
          </label>
          <label className="knockout-option">
            <input
              type="radio"
              name={`winnerSide:${match.id}`}
              value="AWAY"
              defaultChecked={pickedAway}
            />
            <span className="knockout-option-body">
              <TeamLabel name={match.away} />
              <small>Pasa</small>
            </span>
          </label>
        </div>
      )}
    </article>
  );
}
