import { AdminResultsForm } from "@/components/AdminResultsForm";
import { CreateUserForm } from "@/components/CreateUserForm";
import { DeleteUserButton } from "@/components/DeleteUserButton";
import { ScoringSettingsForm } from "@/components/ScoringSettingsForm";
import { SyncApiForm } from "@/components/SyncApiForm";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { teamName, withGuatemalaSchedule } from "@/lib/match-ui";
import { getScoringRules } from "@/lib/scoring-settings";
import { stageOrder } from "@/lib/stages";
import type { MatchStage } from "@prisma/client";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [users, teams, matches, scoringRules] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: "asc" },
    }),
    getScoringRules(),
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
        <SyncApiForm />
      </header>

      <section className="two-column">
        <div className="panel">
          <div className="panel-head">
            <h2>Crear usuario</h2>
          </div>
          <CreateUserForm />
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
