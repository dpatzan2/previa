import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { participantWhere } from "@/lib/participants";

export default async function LeaderboardPage() {
  await requireUser();
  const users = await prisma.user.findMany({
    where: participantWhere,
    include: { predictions: true },
    orderBy: { displayName: "asc" },
  });

  const rows = users
    .map((user) => ({
      id: user.id,
      name: user.displayName,
      predictions: user.predictions.length,
      points: user.predictions.reduce((sum, prediction) => sum + prediction.points, 0),
    }))
    .sort((a, b) => b.points - a.points || b.predictions - a.predictions);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Competencia</span>
          <h1>Tabla de posiciones</h1>
        </div>
      </header>
      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Participante</th>
              <th>Pronosticos</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr className="clickable-row" key={row.id}>
                <td>{index + 1}</td>
                <td>
                  <Link className="table-link" href={`/leaderboard/${row.id}`}>
                    {row.name}
                  </Link>
                </td>
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
