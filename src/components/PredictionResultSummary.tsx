import { Check, X } from "lucide-react";
import type { DisplayMarketAnswer, DisplayMatch } from "@/lib/match-ui";
import { derivedMarketResult, formatMarketValue } from "@/lib/market-result-display";
import { roomMarketLabel, type RoomMarketKey } from "@/lib/room-presets";

export function PredictionResultSummary({
  match,
  scorePoints,
  predictedHomeScore,
  predictedAwayScore,
  answers,
  officialResults,
}: {
  match: DisplayMatch;
  scorePoints: number;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  answers: Partial<Record<RoomMarketKey, DisplayMarketAnswer>>;
  officialResults: Partial<Record<RoomMarketKey, Record<string, unknown>>>;
}) {
  if (match.status !== "FINISHED") return null;

  const rows = Object.entries(answers).flatMap(([key, answer]) => {
    if (!answer) return [];
    const market = key as RoomMarketKey;
    const official = derivedMarketResult(market, match) ?? officialResults[market] ?? null;
    return [{ market, answer, official }];
  });
  const bonusPoints = rows.reduce((sum, row) => sum + row.answer.points, 0);

  return (
    <details className="prediction-result-summary">
      <summary>
        <span>Resultado de tus pronósticos</span>
        <span className="prediction-points-breakdown">
          <b>Marcador {scorePoints}</b>
          <b>Bonus {bonusPoints}</b>
          <strong>Total {scorePoints + bonusPoints} pts</strong>
        </span>
      </summary>
      <div className="prediction-result-official">
        <span>Tu marcador: <strong>{predictedHomeScore ?? "—"} : {predictedAwayScore ?? "—"}</strong></span>
        <span>Oficial: <strong>{match.homeScore} : {match.awayScore}</strong></span>
      </div>
      {rows.length > 0 ? (
        <div className="prediction-result-list">
          {rows.map(({ market, answer, official }) => {
            const scored = answer.points > 0;
            return (
              <div className={`prediction-result-row${scored ? " scored" : " missed"}`} key={market}>
                <span className="prediction-result-icon" aria-label={scored ? "Sumó puntos" : "No sumó puntos"}>
                  {scored ? <Check size={16} /> : <X size={16} />}
                </span>
                <strong>{roomMarketLabel(market)}</strong>
                <span><small>Tu elección</small>{formatMarketValue(market, answer.value, match)}</span>
                <span><small>Resultado</small>{formatMarketValue(market, official, match, true)}</span>
                <b>{answer.points} pts</b>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted prediction-result-empty">No registraste pronósticos bonus para este partido.</p>
      )}
    </details>
  );
}
