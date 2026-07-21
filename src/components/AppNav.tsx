import Link from "next/link";
import { CalendarDays, Gauge, Settings, Users } from "lucide-react";
import type { Role } from "@prisma/client";

export function AppNav({
  role,
}: {
  role: Role;
}) {
  return (
    <nav className="nav-list">
      <Link href="/dashboard">
        <Gauge size={18} />
        Panel
      </Link>
      <Link href="/rooms">
        <Users size={18} />
        Salas
      </Link>
      <Link href="/calendar">
        <CalendarDays size={18} />
        Calendario
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
