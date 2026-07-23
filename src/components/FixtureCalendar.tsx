"use client";

import { Clock3, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { DateCarousel } from "@/components/DateCarousel";
import { TeamLabel } from "@/components/TeamLabel";
import { defaultDateKey, TBD_DATE_KEY } from "@/lib/match-ui";
import { formatAppDate, formatAppDateKey, formatAppTime } from "@/lib/timezone";

export type CalendarMatch = {
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

export function FixtureCalendar({ matches }: { matches: CalendarMatch[] }) {
  const days = useMemo(() => {
    const byKey = new Map<string, { dateKey: string; kickoffAt: Date | null; matches: CalendarMatch[] }>();
    for (const match of matches) {
      // kickoffAt viaja como string en el payload RSC; normalizamos aqui.
      const kickoffAt = match.kickoffAt ? new Date(match.kickoffAt) : null;
      const dateKey = kickoffAt ? formatAppDateKey(kickoffAt) : TBD_DATE_KEY;
      const day = byKey.get(dateKey) ?? { dateKey, kickoffAt, matches: [] };
      day.matches.push({ ...match, kickoffAt });
      byKey.set(dateKey, day);
    }
    return [...byKey.values()];
  }, [matches]);

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const effectiveDateKey =
    selectedDateKey && days.some((day) => day.dateKey === selectedDateKey)
      ? selectedDateKey
      : defaultDateKey(days);
  const day = days.find((item) => item.dateKey === effectiveDateKey);

  if (!day) {
    return <section className="panel empty-state-panel"><h2>Sin partidos registrados</h2></section>;
  }

  return (
    <div className="fixture-day-list">
      {days.length > 1 ? (
        <section className="panel date-carousel-panel">
          <DateCarousel tabs={days} selectedDateKey={effectiveDateKey} onSelect={setSelectedDateKey} />
        </section>
      ) : null}
      <section className="fixture-day panel">
        <header>
          <h2>{day.kickoffAt ? formatAppDate(day.kickoffAt) : "Fecha por definir"}</h2>
          <span>{day.matches.length} partidos</span>
        </header>
        <div>
          {day.matches.map((match) => <FixtureMatchRow match={match} key={match.id} />)}
        </div>
      </section>
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
