import Link from "next/link";
import { BarChart3, ClipboardList, Gauge, Settings } from "lucide-react";
import type { Role } from "@prisma/client";
import { canParticipateInPool } from "@/lib/participants";

export function AppNav({
  role,
  canParticipate,
}: {
  role: Role;
  canParticipate: boolean;
}) {
  return (
    <nav className="nav-list">
      <Link href="/dashboard">
        <Gauge size={18} />
        Panel
      </Link>
      {canParticipateInPool({ canParticipate }) ? (
        <Link href="/picks">
          <ClipboardList size={18} />
          Pronosticos
        </Link>
      ) : null}
      <Link href="/leaderboard">
        <BarChart3 size={18} />
        Tabla
      </Link>
      {role === "ADMIN" ? (
        <Link href="/admin">
          <Settings size={18} />
          Admin
        </Link>
      ) : null}
    </nav>
  );
}
