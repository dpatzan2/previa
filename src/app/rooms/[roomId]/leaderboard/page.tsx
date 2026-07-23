import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRoomMembership } from "@/lib/rooms";
import { RoomHeader } from "@/components/RoomHeader";

export default async function RoomLeaderboardPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const user = await requireUser();
  const { roomId } = await params;
  const { room, membership } = await requireRoomMembership(roomId, user.id);
  const canManage = membership.role === "OWNER" || membership.role === "ADMIN";

  const entries = await prisma.roomLeaderboardEntry.findMany({
    where: { roomId },
    include: { user: { select: { displayName: true } } },
    orderBy: [{ totalPoints: "desc" }, { predictionCount: "desc" }, { userId: "asc" }],
  });

  const roleByUserId = new Map(room.members.map((member) => [member.userId, member.role]));
  const rows = entries.map((entry) => ({
    id: entry.userId,
    name: entry.user.displayName,
    role: roleByUserId.get(entry.userId) ?? "MEMBER",
    predictions: entry.predictionCount,
    points: entry.totalPoints,
  }));

  const podiumRows = rows.slice(0, 3);
  const restRows = rows.slice(3);

  return (
    <div className="page">
      <Link className="back-link" href="/rooms">
        <ArrowLeft size={16} />
        Volver a salas
      </Link>
      <RoomHeader
        roomId={room.id}
        roomName={room.name}
        accessCode={room.accessCode}
        activeTab="leaderboard"
        canManage={canManage}
      />

      {rows.length === 0 ? (
        <section className="panel empty-state-panel">
          <h2>Todavia no hay pronosticos puntuados</h2>
          <p>La tabla aparecera aqui en cuanto haya resultados.</p>
        </section>
      ) : (
        <>
          <div className="podium">
            {podiumRows.map((row, index) => {
              const place = index + 1;
              return (
                <div key={row.id} className={`podium-place podium-place-${place}`}>
                  <div className="podium-card">
                    {place === 1 && <Trophy className="podium-trophy" size={20} />}
                    <strong className="podium-name">{row.name}</strong>
                    <span className="podium-meta">{row.predictions} pronosticos</span>
                    <span className="podium-points">{row.points} pts</span>
                  </div>
                  <div className="podium-block">
                    <span className="podium-rank">{place}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {restRows.length > 0 && (
            <div className="panel">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Participante</th>
                    <th>Rol</th>
                    <th>Pronosticos</th>
                    <th>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {restRows.map((row, index) => (
                    <tr key={row.id}>
                      <td>{index + 4}</td>
                      <td>{row.name}</td>
                      <td>{row.role}</td>
                      <td>{row.predictions}</td>
                      <td>
                        <strong>{row.points}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
