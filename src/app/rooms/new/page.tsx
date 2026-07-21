import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createRoomAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { prisma } from "@/lib/db";
import {
  roomPresetDescription,
  roomPresetLabels,
  tournamentTypeLabels,
} from "@/lib/room-presets";

const presets = ["BASIC", "INTERMEDIATE", "COMPLETE", "CUSTOM"] as const;

export default async function NewRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;

  const competitions = await prisma.competition.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true, season: true },
  });

  return (
    <div className="page narrow-page">
      <Link className="back-link" href="/rooms">
        <ArrowLeft size={16} />
        Volver a salas
      </Link>
      <header className="page-header">
        <div>
          <span className="eyebrow">Nueva sala</span>
          <h1>Crear quiniela</h1>
        </div>
      </header>

      <form action={createRoomAction} className="panel stack-form room-form">
        {error ? (
          <p className="form-error">Revisa los datos de la sala antes de continuar.</p>
        ) : null}

        <label>
          Nombre de la sala
          <input name="name" placeholder="Ej. Oficina, familia, cuates" required minLength={3} />
        </label>

        {competitions.length > 0 ? (
          <label>
            Competencia
            <select
              name="competitionId"
              defaultValue={competitions[0]?.id ?? ""}
              id="competition-select"
            >
              {competitions.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                  {comp.season ? ` (${comp.season})` : ""}
                </option>
              ))}
            </select>
            <input
              type="hidden"
              name="tournamentName"
              value={competitions[0]?.name ?? ""}
              id="tournament-name-hidden"
            />
            <input
              type="hidden"
              name="tournamentType"
              value={competitions[0]?.type ?? "CUSTOM"}
              id="tournament-type-hidden"
            />
          </label>
        ) : (
          <>
            <label>
              Nombre del torneo
              <input
                name="tournamentName"
                placeholder="Ej. Mundial 2026"
                required
                minLength={2}
              />
            </label>
            <input type="hidden" name="tournamentType" value="CUSTOM" />
          </>
        )}

        <CompetitionSyncScript competitions={competitions} />

        <fieldset className="room-preset-fieldset">
          <legend>Configuracion inicial</legend>
          <div className="room-preset-grid">
            {presets.map((preset) => (
              <label className="room-preset-option" key={preset}>
                <input
                  type="radio"
                  name="configPreset"
                  value={preset}
                  defaultChecked={preset === "BASIC"}
                />
                <span>
                  <strong>{roomPresetLabels[preset]}</strong>
                  <small>{roomPresetDescription(preset)}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="room-preset-fieldset">
          <legend>Cierre de pronosticos</legend>
          <div className="room-preset-grid">
            <label className="room-preset-option">
              <input type="radio" name="deadlineMode" value="PER_MATCH" defaultChecked />
              <span>
                <strong>Antes de cada partido</strong>
                <small>Cada partido se puede editar hasta el margen definido antes de su inicio.</small>
              </span>
            </label>
            <label className="room-preset-option">
              <input type="radio" name="deadlineMode" value="PHASE" />
              <span>
                <strong>Antes de cada fase</strong>
                <small>Todos los partidos de una fase cierran juntos antes del primer partido de esa fase.</small>
              </span>
            </label>
          </div>
          <label className="room-inline-number">
            Horas antes del inicio
            <input
              type="number"
              name="deadlineHoursBefore"
              min="0"
              max="168"
              defaultValue="1"
            />
          </label>
        </fieldset>

        <fieldset className="room-preset-fieldset">
          <legend>Experiencia de pronosticos</legend>
          <label>
            Predicciones populares
            <select name="popularPredictionsVisibility" defaultValue="AFTER_PICK">
              <option value="ALWAYS">Mostrar siempre</option>
              <option value="AFTER_PICK">Despues de hacer mi pick</option>
              <option value="AFTER_DEADLINE">Despues del cierre</option>
              <option value="HIDDEN">No mostrar</option>
            </select>
            <small>Solo se muestran porcentajes anonimos, nunca quien eligio cada opcion.</small>
          </label>
          <div className="room-inline-settings">
            <label className="checkbox-label">
              <input type="checkbox" name="championPickEnabled" defaultChecked />
              Permitir pronostico de campeon
            </label>
            <label className="room-inline-number">
              Puntos por acertar
              <input type="number" name="championPickPoints" min="0" max="99" defaultValue="5" />
            </label>
          </div>
        </fieldset>

        <SubmitButton className="primary-button" pendingText="Creando...">
          Crear sala
        </SubmitButton>
      </form>
    </div>
  );
}

function CompetitionSyncScript({
  competitions,
}: {
  competitions: { id: string; name: string; type: string }[];
}) {
  if (competitions.length === 0) return null;

  const competitionMap = Object.fromEntries(
    competitions.map((c) => [c.id, { name: c.name, type: c.type }]),
  );

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            var map = ${JSON.stringify(competitionMap)};
            var sel = document.getElementById('competition-select');
            var nameField = document.getElementById('tournament-name-hidden');
            var typeField = document.getElementById('tournament-type-hidden');
            if (!sel || !nameField || !typeField) return;
            function sync() {
              var c = map[sel.value];
              if (c) {
                nameField.value = c.name;
                typeField.value = c.type;
              }
            }
            sel.addEventListener('change', sync);
            sync();
          })();
        `,
      }}
    />
  );
}
