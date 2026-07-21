import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function formatUTCForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  const { competitionId } = await params;

  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        matches: {
          include: {
            phase: true,
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    });

    if (!competition) {
      return new NextResponse("Competición no encontrada", { status: 404 });
    }

    const stamp = formatUTCForICS(new Date());
    let icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Previa//Competition Calendar//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${competition.name} - Previa`,
      `X-WR-CALDESC:Calendario oficial con seguimiento de marcadores en vivo para ${competition.name}`,
      "X-WR-TIMEZONE:America/Guatemala",
    ];

    for (const match of competition.matches) {
      if (!match.kickoffAt) continue;

      const startDate = new Date(match.kickoffAt);
      const endDate = new Date(startDate.getTime() + 105 * 60 * 1000); // 105 minutes duration

      const homeName = match.homeTeam?.name ?? match.homePlaceholder ?? "Local";
      const awayName = match.awayTeam?.name ?? match.awayPlaceholder ?? "Visitante";

      let summary = `${homeName} vs ${awayName}`;
      let stateLabel = "Programado";

      if (match.status === "FINISHED") {
        summary = `[FIN] ${homeName} (${match.homeScore ?? 0}) - (${match.awayScore ?? 0}) ${awayName}`;
        stateLabel = `Finalizado (${match.homeScore ?? 0} - ${match.awayScore ?? 0})`;
      } else if (match.status === "LIVE") {
        summary = `[VIVO] ${homeName} (${match.homeScore ?? 0}) - (${match.awayScore ?? 0}) ${awayName}`;
        stateLabel = `En Vivo (${match.homeScore ?? 0} - ${match.awayScore ?? 0})`;
      }

      let description = [
        `Competición: ${competition.name}`,
        match.phase ? `Fase: ${match.phase.name}` : null,
        `Estado: ${stateLabel}`,
        match.venue ? `Sede: ${match.venue}` : null,
        `Sincronizado vía Previa App.`,
      ]
        .filter(Boolean)
        .join("\n");

      icsLines.push("BEGIN:VEVENT");
      icsLines.push(`UID:match-${match.id}@previa.app`);
      icsLines.push(`DTSTAMP:${stamp}`);
      icsLines.push(`DTSTART:${formatUTCForICS(startDate)}`);
      icsLines.push(`DTEND:${formatUTCForICS(endDate)}`);
      icsLines.push(`SUMMARY:${escapeText(summary)}`);
      icsLines.push(`DESCRIPTION:${escapeText(description)}`);
      if (match.venue) {
        icsLines.push(`LOCATION:${escapeText(match.venue)}`);
      }
      icsLines.push("END:VEVENT");
    }

    icsLines.push("END:VCALENDAR");

    const icsContent = icsLines.join("\r\n");

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${competition.id}.ics"`,
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (error) {
    console.error("Failed to generate ICS feed", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
