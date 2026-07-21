import { BarChart3, Lock } from "lucide-react";
import type { DisplayMatch, PopularPrediction } from "@/lib/match-ui";

function Percent({ label, value }: { label: string; value: number }) {
  return (
    <div className="popular-prediction-value">
      <strong>{value}%</strong>
      <span>{label}</span>
    </div>
  );
}

export function PopularPredictions({
  match,
  prediction,
}: {
  match: DisplayMatch;
  prediction?: PopularPrediction;
}) {
  if (!prediction) return null;
  return (
    <section className="popular-predictions" aria-label="Predicciones populares">
      <header>
        <BarChart3 size={16} />
        <strong>Predicciones populares</strong>
        {prediction.visible ? <span>{prediction.total} picks</span> : null}
      </header>
      {prediction.visible ? (
        <>
          <div className="popular-prediction-grid">
            <Percent label={match.home} value={prediction.homePercent} />
            <Percent label="Empate" value={prediction.drawPercent} />
            <Percent label={match.away} value={prediction.awayPercent} />
          </div>
          {match.stage !== "GROUP" && prediction.advanceHomePercent !== undefined ? (
            <p>
              Clasifica: <strong>{match.home} {prediction.advanceHomePercent}%</strong>
              <span> · </span>
              <strong>{match.away} {prediction.advanceAwayPercent}%</strong>
            </p>
          ) : null}
        </>
      ) : (
        <div className="popular-predictions-locked">
          <Lock size={15} />
          Se habilitan segun la privacidad configurada por la sala.
        </div>
      )}
    </section>
  );
}
