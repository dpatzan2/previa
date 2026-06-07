import { CalendarClock, CheckCircle2, Medal, Shield, Users } from "lucide-react";
import { QuinielaRulesPanel } from "@/components/QuinielaRulesPanel";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isNonParticipatingAdmin, participantWhere } from "@/lib/participants";
import { getScoringRules } from "@/lib/scoring-settings";
import { stageLabels } from "@/lib/stages";

export default async function DashboardPage() {
  const user = await requireUser();
  const isManagerOnly = isNonParticipatingAdmin(user);

  const [matches, participantCount, mine, scoringRules] = await Promise.all([
    prisma.match.findMany({ orderBy: { matchNumber: "asc" } }),
    prisma.user.count({ where: participantWhere }),
    user.canParticipate
      ? prisma.prediction.findMany({ where: { userId: user.id } })
      : Promise.resolve([]),
    getScoringRules(),
  ]);

  const finished = matches.filter((match) => match.status === "FINISHED").length;
  const points = mine.reduce((sum, item) => sum + item.points, 0);
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
        <QuinielaRulesPanel rules={scoringRules} />
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
