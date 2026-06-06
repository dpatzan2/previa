import { CalendarClock, CheckCircle2, Medal, Shield, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isNonParticipatingAdmin, participantWhere } from "@/lib/participants";
import { stageLabels } from "@/lib/stages";

export default async function DashboardPage() {
  const user = await requireUser();
  const isManagerOnly = isNonParticipatingAdmin(user);

  const [matches, participantCount, mine, leaderboard] = await Promise.all([
    prisma.match.findMany({ orderBy: { matchNumber: "asc" } }),
    prisma.user.count({ where: participantWhere }),
    user.canParticipate
      ? prisma.prediction.findMany({ where: { userId: user.id } })
      : Promise.resolve([]),
    prisma.user.findMany({
      where: participantWhere,
      include: { predictions: true },
      orderBy: { displayName: "asc" },
    }),
  ]);

  const finished = matches.filter((match) => match.status === "FINISHED").length;
  const points = mine.reduce((sum, item) => sum + item.points, 0);
  const leaders = leaderboard
    .map((item) => ({
      name: item.displayName,
      points: item.predictions.reduce((sum, prediction) => sum + prediction.points, 0),
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);
  const nextMatch = matches.find((match) => match.kickoffAt && match.kickoffAt > new Date());

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Panel general</span>
          <h1>Quiniela Mundial 2026</h1>
        </div>
      </header>

      {isManagerOnly ? (
        <p className="admin-participant-note">
          Cuenta administrador principal: gestionas usuarios y resultados, pero no participas en
          la quiniela.
        </p>
      ) : null}

      <section className="metric-grid">
        {isManagerOnly ? (
          <Metric icon={<Shield size={20} />} label="Rol" value="Administrador" />
        ) : (
          <Metric icon={<Medal size={20} />} label="Mis puntos" value={points} />
        )}
        <Metric icon={<CheckCircle2 size={20} />} label="Partidos cerrados" value={`${finished}/104`} />
        <Metric icon={<Users size={20} />} label="Participantes" value={participantCount} />
        <Metric
          icon={<CalendarClock size={20} />}
          label="Siguiente partido"
          value={nextMatch ? `P${nextMatch.matchNumber}` : "Sin fecha"}
        />
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="panel-head">
            <h2>Estado del fixture</h2>
          </div>
          <div className="stage-list">
            {Object.entries(stageLabels).map(([stage, label]) => {
              const stageMatches = matches.filter((match) => match.stage === stage);
              const done = stageMatches.filter((match) => match.status === "FINISHED").length;
              return (
                <div className="stage-row" key={stage}>
                  <span>{label}</span>
                  <strong>
                    {done}/{stageMatches.length}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h2>Tabla rápida</h2>
          </div>
          <div className="leader-list">
            {leaders.map((leader, index) => (
              <div className="leader-row" key={leader.name}>
                <span>{index + 1}</span>
                <strong>{leader.name}</strong>
                <em>{leader.points} pts</em>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="metric">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
