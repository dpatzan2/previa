import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TeamsCatalog } from "@/components/TeamsCatalog";

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;

  const rawTeams = await prisma.team.findMany({
    orderBy: { name: "asc" },
  });

  const rawCompTeams = await prisma.competitionTeam.findMany({
    include: {
      competition: {
        select: { id: true, name: true },
      },
    },
  });

  const teams = rawTeams.map((t) => {
    const matchingComps = rawCompTeams
      .filter((ct) => ct.normalizedName === t.normalizedName)
      .map((ct) => ct.competition);

    return {
      id: t.id,
      name: t.name,
      normalizedName: t.normalizedName,
      logoUrl: t.logoUrl,
      competitions: matchingComps,
    };
  });

  const competitions = await prisma.competition.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="page">
      <Link className="back-link" href="/admin">
        <ArrowLeft size={16} />
        Volver a administración
      </Link>

      <header className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <span className="eyebrow">Administración</span>
          <h1>Catálogo de Equipos</h1>
        </div>
      </header>

      {query.saved ? (
        <p className="form-action-feedback success" style={{ marginBottom: "18px" }}>
          Equipo actualizado correctamente.
        </p>
      ) : null}
      {query.error ? (
        <p className="form-action-feedback error" style={{ marginBottom: "18px" }}>
          No se pudo actualizar el equipo. Puede que el nombre ya esté en uso o sea inválido.
        </p>
      ) : null}

      <TeamsCatalog teams={teams} competitions={competitions} />
    </div>
  );
}
