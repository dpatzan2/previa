import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  const members = await prisma.roomMember.findMany({
    where: { roomId },
    include: {
      user: {
        include: {
          predictions: {
            where: { roomId },
          },
          predictionAnswers: {
            where: { roomId },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const rows = members
    .map((member) => ({
      id: member.userId,
      name: member.user.displayName,
      role: member.role,
      predictions: member.user.predictions.length + member.user.predictionAnswers.length,
      points:
        member.user.predictions.reduce((sum, prediction) => sum + prediction.points, 0) +
        member.user.predictionAnswers.reduce((sum, answer) => sum + answer.points, 0),
    }))
    .sort((a, b) => b.points - a.points || b.predictions - a.predictions || a.name.localeCompare(b.name));

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
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td>{index + 1}</td>
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
    </div>
  );
}
