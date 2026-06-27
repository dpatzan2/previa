import type { ScoringRules } from "@/lib/scoring-settings";

export function QuinielaRulesPanel({ rules }: { rules: ScoringRules }) {
  return (
    <div className="panel quiniela-rules-panel">
      <div className="panel-head">
        <h2>Reglas de la quiniela</h2>
        <span>Como se suman los puntos</span>
      </div>
      <div className="quiniela-rules-content">
        <section className="quiniela-rules-group">
          <h3>Fase de grupos</h3>
          <ul className="quiniela-rules-list">
            <li>
              <strong>{rules.groupExactPoints} pts</strong>
              <span>
                Marcador exacto: aciertas ambos goles del partido (ej. pronostico 1-2 y resultado
                1-2).
              </span>
            </li>
            <li>
              <strong>{rules.groupOutcomePoints} pt</strong>
              <span>
                Solo ganador o empate: aciertas local, visitante o empate aunque el marcador sea
                distinto (ej. pronostico 0-0 y resultado 1-1).
              </span>
            </li>
            <li>
              <strong>0 pts</strong>
              <span>Sin acierto en ganador o empate.</span>
            </li>
          </ul>
        </section>
        <section className="quiniela-rules-group">
          <h3>Eliminatorias</h3>
          <ul className="quiniela-rules-list">
            <li>
              <strong>{rules.groupExactPoints} pts</strong>
              <span>Marcador exacto y aciertas quien pasa a la siguiente fase.</span>
            </li>
            <li>
              <strong>{rules.knockoutAdvancePoints} pt</strong>
              <span>Aciertas quien pasa, pero el marcador es distinto.</span>
            </li>
            <li>
              <strong>0 pts</strong>
              <span>No aciertas quien pasa.</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
