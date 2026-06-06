import { Save } from "lucide-react";
import { saveScoringSettingsAction } from "@/app/actions";
import type { ScoringRules } from "@/lib/scoring-settings";

export function ScoringSettingsForm({ rules }: { rules: ScoringRules }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Reglas de puntuacion</h2>
        <span>Puntos por acierto</span>
      </div>
      <form action={saveScoringSettingsAction} className="stack-form compact scoring-rules-form">
        <div className="scoring-rules-grid">
          <fieldset className="scoring-rule-group">
            <legend>Fase de grupos</legend>
            <label>
              Marcador exacto
              <input
                name="groupExactPoints"
                type="number"
                min="0"
                max="99"
                defaultValue={rules.groupExactPoints}
                required
              />
            </label>
            <label>
              Solo ganador o empate (marcador distinto)
              <input
                name="groupOutcomePoints"
                type="number"
                min="0"
                max="99"
                defaultValue={rules.groupOutcomePoints}
                required
              />
            </label>
          </fieldset>
          <fieldset className="scoring-rule-group">
            <legend>Eliminatorias</legend>
            <label>
              Quien pasa a la siguiente fase
              <input
                name="knockoutAdvancePoints"
                type="number"
                min="0"
                max="99"
                defaultValue={rules.knockoutAdvancePoints}
                required
              />
            </label>
          </fieldset>
        </div>
        <ul className="scoring-rules-note muted">
          <li>Marcador exacto: mismo resultado y mismo ganador o empate.</li>
          <li>
            Solo ganador o empate: acierta local, visitante o empate aunque el marcador no
            coincida (ej. pronostico 0-0 y resultado 1-1).
          </li>
          <li>Sin acierto en ganador o empate: 0 puntos.</li>
          <li>Al guardar se recalculan los puntos de todos los participantes.</li>
        </ul>
        <button className="primary-button" type="submit">
          <Save size={18} />
          Guardar reglas
        </button>
      </form>
    </section>
  );
}
