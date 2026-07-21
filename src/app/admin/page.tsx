import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createGlobalTeamAction } from "@/app/actions";

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  ARCHIVED: "Archivada",
};

const statusClass: Record<string, string> = {
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; created?: string; error?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;

  const competitions = await prisma.competition.findMany({
    include: {
      phases: true,
      teams: true,
      matches: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Administracion</span>
          <h1>Competiciones</h1>
        </div>
        <div className="header-actions">
          <Link href="/admin/new" className="primary-button">
            <Plus size={17} />
            Nueva competencia
          </Link>
        </div>
      </header>

      {query.deleted ? (
        <p className="form-action-feedback success">Competencia eliminada correctamente.</p>
      ) : null}
      {query.created === "global-team" ? (
        <p className="form-action-feedback success">Equipo creado y registrado en el catálogo global.</p>
      ) : null}
      {query.error ? (
        <p className="form-action-feedback error">Ocurrio un error. Revisa los datos.</p>
      ) : null}

      <section className="metric-grid">
        <Metric label="Competiciones" value={competitions.length} />
        <Metric
          label="Activas"
          value={competitions.filter((c) => c.status === "ACTIVE").length}
        />
        <Metric
          label="Equipos"
          value={competitions.reduce((s, c) => s + c.teams.length, 0)}
        />
        <Metric
          label="Partidos"
          value={competitions.reduce((s, c) => s + c.matches.length, 0)}
        />
      </section>

      {competitions.length === 0 ? (
        <section className="panel">
          <div className="admin-empty-state">
            <Trophy size={40} strokeWidth={1.5} color="var(--muted)" />
            <h2>Sin competencias todavia</h2>
            <p>Crea tu primera competencia para comenzar a configurar fases, equipos y partidos.</p>
            <Link href="/admin/new" className="primary-button">
              <Plus size={17} />
              Crear competencia
            </Link>
          </div>
        </section>
      ) : (
        <div className="admin-overview-grid">
          <div>
            <section className="admin-competition-grid" style={{ gridTemplateColumns: "1fr" }}>
              {competitions.map((competition) => (
                <Link
                  key={competition.id}
                  href={`/admin/${competition.id}`}
                  className="admin-competition-card"
                  style={{ minHeight: "150px" }}
                >
                  <div className="admin-competition-card-head">
                    <div className="admin-competition-card-meta">
                      <span className={`status-badge ${statusClass[competition.status]}`}>
                        {statusLabels[competition.status]}
                      </span>
                      {competition.season ? <span>{competition.season}</span> : null}
                    </div>
                    <h3>{competition.name}</h3>
                  </div>
                  <dl>
                    <div>
                      <dt>Fases</dt>
                      <dd>{competition.phases.length}</dd>
                    </div>
                    <div>
                      <dt>Equipos</dt>
                      <dd>{competition.teams.length}</dd>
                    </div>
                    <div>
                      <dt>Partidos</dt>
                      <dd>{competition.matches.length}</dd>
                    </div>
                  </dl>
                </Link>
              ))}
            </section>
          </div>

          <div>
            <form action={createGlobalTeamAction} className="panel stack-form room-form">
              <div className="panel-inline-head">
                <h2>Registrar equipo global</h2>
                <Link href="/admin/teams" style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--primary)" }}>
                  Ver catálogo
                </Link>
              </div>
              <p className="muted" style={{ margin: "0", fontSize: "0.84rem" }}>
                Crea un equipo en el catálogo global y asócialo a múltiples competencias al mismo tiempo.
              </p>
              <label>
                Nombre del equipo
                <input name="name" placeholder="Ej. Real Madrid, Barcelona" required minLength={2} />
              </label>

              <label style={{ marginTop: "10px" }}>
                Escudo / Logo URL
                <input name="logoUrl" placeholder="Ej. https://domain.com/escudo.png (Opcional)" />
              </label>

              <fieldset className="room-preset-fieldset">
                <legend>Asociar a competencias</legend>
                {competitions.length === 0 ? (
                  <p className="muted">No hay competencias creadas.</p>
                ) : (
                  <div style={{ display: "grid", gap: "10px", maxHeight: "180px", overflowY: "auto", padding: "6px 2px" }}>
                    {competitions.map((comp) => (
                      <label key={comp.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "normal", cursor: "pointer", fontSize: "0.88rem" }}>
                        <input
                          type="checkbox"
                          name="competitions"
                          value={comp.id}
                          style={{ width: "16px", minHeight: "16px", flexShrink: 0 }}
                        />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {comp.name} {comp.season ? `(${comp.season})` : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              <button className="primary-button" type="submit">
                Registrar equipo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric compact-metric">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
