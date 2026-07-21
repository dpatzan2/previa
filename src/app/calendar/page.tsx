import Link from "next/link";
import { BarChart3, CalendarDays, Clock3, MapPin } from "lucide-react";
import { CalendarSyncButtons } from "@/components/CalendarSyncButtons";
import { TeamLabel } from "@/components/TeamLabel";
import { requireUser } from "@/lib/auth";
import {
  calculateBestThirds,
  calculateStandings,
  type FormResult,
  type StandingRow,
} from "@/lib/competition-insights";
import { prisma } from "@/lib/db";
import { tournamentTypeLabels } from "@/lib/room-presets";
import { formatAppDate, formatAppDateKey, formatAppTime } from "@/lib/timezone";

const statusLabels = { DRAFT: "Borrador", ACTIVE: "Activa", ARCHIVED: "Archivada" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; view?: string }>;
}) {
  await requireUser();
  const query = await searchParams;
  const competitions = await prisma.competition.findMany({
    where: { status: "ACTIVE" },
    include: {
      teams: { orderBy: { name: "asc" } },
      phases: {
        include: {
          matches: {
            include: { homeTeam: true, awayTeam: true },
            orderBy: [{ kickoffAt: "asc" }, { matchNumber: "asc" }],
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      matches: {
        include: { phase: true, homeTeam: true, awayTeam: true },
        orderBy: [{ kickoffAt: "asc" }, { matchNumber: "asc" }],
      },
    },
    orderBy: [{ startsAt: "desc" }, { name: "asc" }],
  });
  const selected = competitions.find((competition) => competition.id === query.competition) ?? competitions[0] ?? null;
  const view = query.view === "standings" ? "standings" : "fixture";

  if (!selected) {
    return (
      <div className="page">
        <header className="page-header"><div><span className="eyebrow">Competiciones</span><h1>Calendario</h1></div></header>
        <section className="panel empty-state-panel">
          <CalendarDays size={24} /><h2>No hay competiciones activas</h2>
          <p className="muted">Los torneos publicados por el administrador apareceran aqui.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page competition-page">
      <header className="competition-hero">
        <div className="competition-identity">
          {selected.logoUrl ? <img src={selected.logoUrl} alt="" /> : <span className="competition-logo-placeholder"><CalendarDays size={24} /></span>}
          <div>
            <span className="eyebrow">{tournamentTypeLabels[selected.type]}</span>
            <h1>{selected.name}</h1>
            <p>{selected.season ?? "Temporada actual"} · {statusLabels[selected.status]}</p>
          </div>
        </div>
        <CalendarSyncButtons competitionId={selected.id} competitionName={selected.name} />
      </header>

      <nav className="competition-switcher" aria-label="Seleccionar competicion">
        {competitions.map((competition) => (
          <Link
            className={competition.id === selected.id ? "active" : ""}
            href={`/calendar?competition=${competition.id}&view=${view}`}
            key={competition.id}
          >
            {competition.logoUrl ? <img src={competition.logoUrl} alt="" /> : null}
            <span>{competition.name}</span>
            <small>{competition.season ?? "Actual"}</small>
          </Link>
        ))}
      </nav>

      <nav className="competition-view-tabs">
        <Link className={view === "fixture" ? "active" : ""} href={`/calendar?competition=${selected.id}&view=fixture`}>
          <CalendarDays size={17} />Calendario
        </Link>
        <Link className={view === "standings" ? "active" : ""} href={`/calendar?competition=${selected.id}&view=standings`}>
          <BarChart3 size={17} />Posiciones
        </Link>
      </nav>

      {view === "fixture" ? <FixtureView matches={selected.matches} /> : <StandingsView competition={selected} />}
    </div>
  );
}

type CalendarMatch = {
  id: string;
  kickoffAt: Date | null;
  venue: string | null;
  status: "SCHEDULED" | "LIVE" | "FINISHED";
  homeScore: number | null;
  awayScore: number | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  homeTeam: { id: string; name: string; logoUrl: string | null } | null;
  awayTeam: { id: string; name: string; logoUrl: string | null } | null;
  phase: { name: string } | null;
};

function FixtureView({ matches }: { matches: CalendarMatch[] }) {
  const dated = new Map<string, CalendarMatch[]>();
  const unscheduled: CalendarMatch[] = [];
  for (const match of matches) {
    if (!match.kickoffAt) { unscheduled.push(match); continue; }
    const key = formatAppDateKey(match.kickoffAt);
    (dated.get(key) ?? dated.set(key, []).get(key)!).push(match);
  }
  if (matches.length === 0) return <section className="panel empty-state-panel"><h2>Sin partidos registrados</h2></section>;

  return (
    <div className="fixture-day-list">
      {[...dated.entries()].map(([date, dayMatches]) => (
        <section className="fixture-day panel" key={date}>
          <header><h2>{formatAppDate(dayMatches[0].kickoffAt!)}</h2><span>{dayMatches.length} partidos</span></header>
          <div>
            {dayMatches.map((match) => <FixtureMatchRow match={match} key={match.id} />)}
          </div>
        </section>
      ))}
      {unscheduled.length ? (
        <section className="fixture-day panel"><header><h2>Fecha por definir</h2></header><div>{unscheduled.map((match) => <FixtureMatchRow match={match} key={match.id} />)}</div></section>
      ) : null}
    </div>
  );
}

function FixtureMatchRow({ match }: { match: CalendarMatch }) {
  const home = match.homeTeam?.name ?? match.homePlaceholder ?? "Local";
  const away = match.awayTeam?.name ?? match.awayPlaceholder ?? "Visitante";
  return (
    <article className={`fixture-match ${match.status.toLowerCase()}`}>
      <div className="fixture-team home"><TeamLabel name={home} logoUrl={match.homeTeam?.logoUrl} /></div>
      <div className="fixture-kickoff">
        {match.status === "FINISHED" ? <strong>{match.homeScore} : {match.awayScore}</strong> : <strong>{match.kickoffAt ? formatAppTime(match.kickoffAt) : "Por definir"}</strong>}
        <span>{match.status === "LIVE" ? "En vivo" : match.phase?.name ?? "Sin fase"}</span>
      </div>
      <div className="fixture-team away"><TeamLabel name={away} logoUrl={match.awayTeam?.logoUrl} /></div>
      {match.venue ? <small><MapPin size={12} />{match.venue}</small> : <small><Clock3 size={12} />Hora Guatemala</small>}
    </article>
  );
}

type StandingsCompetition = {
  teams: Array<{ id: string; name: string; logoUrl: string | null; groupCode: string | null }>;
  phases: Array<{
    id: string;
    name: string;
    format: "GROUP" | "KNOCKOUT" | "LEAGUE";
    groupCode: string | null;
    automaticQualifiers: number;
    bestThirdQualifiers: number;
    matches: Array<{
      id: string; kickoffAt: Date | null; status: "SCHEDULED" | "LIVE" | "FINISHED";
      homeScore: number | null; awayScore: number | null;
      homeTeam: { id: string; name: string; logoUrl: string | null } | null;
      awayTeam: { id: string; name: string; logoUrl: string | null } | null;
    }>;
  }>;
};

function StandingsView({ competition }: { competition: StandingsCompetition }) {
  const phases = competition.phases.filter((phase) => phase.format !== "KNOCKOUT");
  const tables = phases.map((phase) => {
    const usedIds = new Set(phase.matches.flatMap((match) => [match.homeTeam?.id, match.awayTeam?.id].filter(Boolean)));
    const phaseTeams = usedIds.size
      ? competition.teams.filter((team) => usedIds.has(team.id))
      : competition.teams.filter((team) => !phase.groupCode || team.groupCode === phase.groupCode);
    return { phase, rows: calculateStandings(phaseTeams, phase.matches, phase.automaticQualifiers) };
  });
  const groupTables = tables.filter((table) => table.phase.format === "GROUP");
  const bestThirdCount = Math.max(0, ...groupTables.map((table) => table.phase.bestThirdQualifiers));
  const bestThirds = bestThirdCount ? calculateBestThirds(groupTables.map((table) => table.rows), bestThirdCount) : [];

  if (tables.length === 0) return <section className="panel empty-state-panel"><h2>Esta competicion no usa tabla de posiciones</h2></section>;
  return (
    <div className="standings-section-list">
      {tables.map(({ phase, rows }) => <StandingsTable title={phase.name} rows={rows} key={phase.id} />)}
      {bestThirds.length ? <StandingsTable title="Mejores terceros" rows={bestThirds} bestThirds /> : null}
    </div>
  );
}

function StandingsTable({ title, rows, bestThirds = false }: { title: string; rows: StandingRow[]; bestThirds?: boolean }) {
  return (
    <section className="standings-panel panel">
      <header><h2>{title}</h2><span>{rows.length} equipos</span></header>
      <div className="standings-scroll"><table><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>GF:GC</th><th>DG</th><th>PTS</th><th>G</th><th>E</th><th>P</th><th>Forma</th></tr></thead>
        <tbody>{rows.map((row) => (
          <tr key={row.team.id} className={row.qualification ? "qualified" : ""}>
            <td>{row.position}</td><td><TeamLabel name={row.team.name} logoUrl={row.team.logoUrl} compact />{row.qualification ? <small>{bestThirds ? "Mejor tercero clasificado" : "Clasificado"}</small> : null}</td>
            <td>{row.played}</td><td>{row.goalsFor}:{row.goalsAgainst}</td><td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td><td><strong>{row.points}</strong></td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td><FormDots values={row.form} /></td>
          </tr>
        ))}</tbody>
      </table></div>
    </section>
  );
}

function FormDots({ values }: { values: FormResult[] }) {
  return <span className="recent-form-dots">{values.length ? values.map((value, index) => <span className={`form-dot ${value.toLowerCase()}`} key={`${value}-${index}`}>{value}</span>) : <span className="muted">—</span>}</span>;
}
