import Link from "next/link";
import { Plus, Ticket } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { roomPresetDescription, roomPresetLabels, tournamentTypeLabels } from "@/lib/room-presets";

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const memberships = await prisma.roomMember.findMany({
    where: { userId: user.id },
    include: {
      room: {
        include: {
          members: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="page">
      {query.deleted ? (
        <p className="form-action-feedback success" style={{ marginBottom: "16px" }}>
          Sala eliminada correctamente.
        </p>
      ) : null}
      <header className="page-header">
        <div>
          <span className="eyebrow">Salas</span>
          <h1>Mis salas</h1>
        </div>
        <div className="header-actions">
          <Link className="ghost-button header-action" href="/rooms/join">
            <Ticket size={17} />
            Unirme
          </Link>
          <Link className="primary-button header-action" href="/rooms/new">
            <Plus size={17} />
            Crear sala
          </Link>
        </div>
      </header>

      {memberships.length === 0 ? (
        <section className="panel empty-state-panel">
          <h2>Todavia no tienes salas</h2>
          <p className="muted">
            Crea una sala para configurar tu quiniela o unete con un codigo de acceso.
          </p>
          <div className="empty-state-actions">
            <Link className="primary-button" href="/rooms/new">
              Crear sala
            </Link>
            <Link className="ghost-button" href="/rooms/join">
              Tengo un codigo
            </Link>
          </div>
        </section>
      ) : (
        <div className="room-grid">
          {memberships.map(({ room, role }) => (
            <Link className="room-card" href={`/rooms/${room.id}`} key={room.id}>
              <div className="room-card-head">
                <span>{role}</span>
                <strong>{room.accessCode}</strong>
              </div>
              <h2>{room.name}</h2>
              <p>{room.tournamentName}</p>
              <dl>
                <div>
                  <dt>Tipo</dt>
                  <dd>{tournamentTypeLabels[room.tournamentType]}</dd>
                </div>
                <div>
                  <dt>Modo</dt>
                  <dd>{roomPresetLabels[room.configPreset]}</dd>
                </div>
                <div>
                  <dt>Miembros</dt>
                  <dd>{room.members.length}</dd>
                </div>
              </dl>
              <small>{roomPresetDescription(room.configPreset)}</small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
