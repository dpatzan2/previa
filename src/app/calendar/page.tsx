import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tournamentTypeLabels } from "@/lib/room-presets";
import { formatAppDateTime } from "@/lib/timezone";

import { CalendarSyncButtons } from "@/components/CalendarSyncButtons";

const statusLabels = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  ARCHIVED: "Archivada",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string }>;
}) {
  await requireUser();
  const query = await searchParams;
  const competitions = await prisma.competition.findMany({
    where: { status: "ACTIVE" },
    include: {
      phases: {
        include: {
          matches: {
            include: {
              homeTeam: true,
              awayTeam: true,
            },
            orderBy: [{ kickoffAt: "asc" }, { matchNumber: "asc" }],
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      matches: {
        include: {
          phase: true,
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: [{ kickoffAt: "asc" }, { matchNumber: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const selected =
    competitions.find((competition) => competition.id === query.competition) ?? competitions[0] ?? null;
  const orphanMatches =
    selected?.matches.filter((match) => !match.phaseId) ?? [];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Calendario</span>
          <h1>Competiciones</h1>
        </div>
      </header>

      {competitions.length === 0 ? (
        <section className="panel empty-state-panel">
          <CalendarDays size={24} />
          <h2>No hay competiciones registradas</h2>
          <p className="muted">Cuando el admin registre torneos, fases y partidos apareceran aqui.</p>
        </section>
      ) : (
        <div className="calendar-layout">
          <aside className="competition-sidebar panel">
            <div className="panel-head">
              <h2>Torneos</h2>
              <span>{competitions.length}</span>
            </div>
            <div className="competition-picker-list">
              {competitions.map((competition) => (
                <Link
                  className={
                    selected?.id === competition.id
                      ? "competition-picker-item active"
                      : "competition-picker-item"
                  }
                  href={`/calendar?competition=${competition.id}`}
                  key={competition.id}
                >
                  <strong>{competition.name}</strong>
                  <span>
                    {tournamentTypeLabels[competition.type]} · {statusLabels[competition.status]}
                  </span>
                  <small>
                    {competition.matches.length} partidos · {competition.phases.length} fases
                  </small>
                </Link>
              ))}
            </div>
          </aside>

          <section className="panel calendar-panel">
            {selected ? (
              <>
                <div className="panel-head calendar-head">
                  <div>
                    <h2>{selected.name}</h2>
                    <span>
                      {tournamentTypeLabels[selected.type]} · {selected.season ?? "Sin temporada"}
                    </span>
                  </div>
                  <strong>{statusLabels[selected.status]}</strong>
                </div>

                <div className="calendar-sync-banner" style={{ margin: "0 18px 18px", padding: "16px", borderRadius: "8px", border: "1px dashed var(--line)", background: "var(--panel-soft)", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "grid", gap: "4px" }}>
                    <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>Sincronizar Calendario</h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.4 }}>
                      Agrega los partidos a tu calendario personal. Los marcadores oficiales se actualizarán automáticamente en vivo a través de nuestra API.
                    </p>
                  </div>
                  <CalendarSyncButtons competitionId={selected.id} competitionName={selected.name} />
                </div>

                <div className="calendar-phase-list">
                  {selected.phases.map((phase) => (
                    <section className="calendar-phase" key={phase.id}>
                      <header>
                        <div>
                          <h3>{phase.name}</h3>
                          <span>
                            {phase.groupCode ? `Grupo ${phase.groupCode} · ` : ""}
                            {phase.matches.length} partidos
                          </span>
                        </div>
                      </header>
                      <MatchRows matches={phase.matches} />
                    </section>
                  ))}

                  {orphanMatches.length > 0 ? (
                    <section className="calendar-phase">
                      <header>
                        <div>
                          <h3>Sin fase</h3>
                          <span>{orphanMatches.length} partidos</span>
                        </div>
                      </header>
                      <MatchRows matches={orphanMatches} />
                    </section>
                  ) : null}
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}

function MatchRows({
  matches,
}: {
  matches: Array<{
    id: string;
    matchNumber: number | null;
    kickoffAt: Date | null;
    venue: string | null;
    homePlaceholder: string | null;
    awayPlaceholder: string | null;
    status: string;
    homeTeam: { name: string } | null;
    awayTeam: { name: string } | null;
  }>;
}) {
  if (matches.length === 0) {
    return <p className="muted empty-inline">Sin partidos registrados.</p>;
  }

  return (
    <div className="calendar-match-list">
      {matches.map((match) => (
        <article className="calendar-match-row" key={match.id}>
          <div>
            <strong>
              {match.homeTeam?.name ?? match.homePlaceholder ?? "Local"} vs{" "}
              {match.awayTeam?.name ?? match.awayPlaceholder ?? "Visitante"}
            </strong>
            <span>{match.venue ?? "Sede por definir"}</span>
          </div>
          <div>
            <small>{match.matchNumber ? `P${match.matchNumber}` : "Sin numero"}</small>
            <time>{match.kickoffAt ? formatAppDateTime(match.kickoffAt) : "Fecha por definir"}</time>
          </div>
        </article>
      ))}
    </div>
  );
}
