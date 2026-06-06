import { UserPlus } from "lucide-react";
import { createUserAction, syncWc2026Action } from "@/app/actions";
import { AdminResultsForm } from "@/components/AdminResultsForm";
import { DeleteUserButton } from "@/components/DeleteUserButton";
import { ScoringSettingsForm } from "@/components/ScoringSettingsForm";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { teamName, withGuatemalaSchedule } from "@/lib/match-ui";
import { getScoringRules } from "@/lib/scoring-settings";
import { stageOrder } from "@/lib/stages";
import type { MatchStage } from "@prisma/client";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await requireAdmin();
  const [users, teams, matches, scoringRules, params] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: "asc" },
    }),
    getScoringRules(),
    searchParams,
  ]);

  const displayMatches = matches.map((match) =>
    withGuatemalaSchedule({
      id: match.id,
      matchNumber: match.matchNumber,
      stage: match.stage,
      groupCode: match.groupCode,
      dateLabel: match.dateLabel,
      timeLabel: match.timeLabel,
      kickoffAt: match.kickoffAt,
      venue: match.venue,
      venueShort: match.venueShort,
      locked: false,
      home: teamName(match.homeTeam, match.homePlaceholder, "Local"),
      away: teamName(match.awayTeam, match.awayPlaceholder, "Visitante"),
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      actualWinnerSide: match.actualWinnerSide,
    }),
  );

  const groupCodes = Array.from(
    new Set(
      displayMatches
        .filter((match) => match.stage === "GROUP")
        .map((match) => match.groupCode)
        .filter(Boolean),
    ),
  ).sort() as string[];

  const stages = stageOrder.filter((stage) =>
    displayMatches.some((match) => match.stage === stage),
  ) as MatchStage[];

  const teamOptions = teams.map((team) => ({ id: team.id, name: team.name }));
  const adminCount = users.filter((user) => user.role === "ADMIN").length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Administracion</span>
          <h1>Usuarios y resultados</h1>
        </div>
        <form action={syncWc2026Action}>
          <button className="ghost-button header-action" type="submit">
            Sincronizar API
          </button>
        </form>
      </header>

      <AdminError error={params.error} />

      <section className="two-column">
        <div className="panel">
          <div className="panel-head">
            <h2>Crear usuario</h2>
          </div>
          <form action={createUserAction} className="stack-form compact">
            <label>
              Usuario
              <input name="username" required minLength={3} />
            </label>
            <label>
              Nombre
              <input name="displayName" required minLength={2} />
            </label>
            <label>
              Contraseña
              <input name="password" type="password" required minLength={6} />
            </label>
            <label>
              Rol
              <select name="role" defaultValue="PLAYER">
                <option value="PLAYER">Jugador</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <button className="primary-button" type="submit">
              <UserPlus size={18} />
              Crear
            </button>
          </form>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h2>Usuarios</h2>
            <span>{users.length} registrados</span>
          </div>
          <table className="data-table tight">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === admin.id;
                const isLastAdmin = user.role === "ADMIN" && adminCount <= 1;
                const canDelete = !isSelf && !isLastAdmin;

                return (
                  <tr key={user.id}>
                    <td>{user.displayName}</td>
                    <td>{user.username}</td>
                    <td>{user.role}</td>
                    <td className="table-actions">
                      {canDelete ? (
                        <DeleteUserButton userId={user.id} displayName={user.displayName} />
                      ) : (
                        <span className="muted table-action-muted">
                          {isSelf ? "Tu cuenta" : "Unico admin"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ScoringSettingsForm rules={scoringRules} />

      <AdminResultsForm
        matches={displayMatches}
        teams={teamOptions}
        groupCodes={groupCodes}
        stages={stages}
      />
    </div>
  );
}

function AdminError({ error }: { error?: string }) {
  if (!error) return null;

  const messages: Record<string, string> = {
    self: "No puedes eliminar tu propia cuenta.",
    "last-admin": "No puedes eliminar al unico administrador.",
    missing: "Ese usuario ya no existe.",
    delete: "No se pudo eliminar el usuario.",
  };

  return <p className="admin-alert form-error">{messages[error] ?? "Ocurrio un error."}</p>;
}
