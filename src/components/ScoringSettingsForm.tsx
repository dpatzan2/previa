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
              Solo resultado (ganador o empate)
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
        <p className="scoring-rules-note muted">
          Al guardar se recalculan los puntos de todos los participantes con estas reglas.
        </p>
        <button className="primary-button" type="submit">
          <Save size={18} />
          Guardar reglas
        </button>
      </form>
    </section>
  );
}
