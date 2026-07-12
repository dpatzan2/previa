"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, Layers, Users, CalendarDays } from "lucide-react";

const tabs = [
  { key: "overview", label: "Resumen", icon: LayoutDashboard },
  { key: "phases", label: "Fases", icon: Layers },
  { key: "teams", label: "Equipos", icon: Users },
  { key: "matches", label: "Partidos", icon: CalendarDays },
] as const;

export function CompetitionTabs({
  competitionId,
  counts,
}: {
  competitionId: string;
  counts: { phases: number; teams: number; matches: number };
}) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const badgeFor = (key: string) => {
    if (key === "phases") return counts.phases;
    if (key === "teams") return counts.teams;
    if (key === "matches") return counts.matches;
    return null;
  };

  return (
    <nav className="admin-tabs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const badge = badgeFor(tab.key);
        return (
          <Link
            key={tab.key}
            href={`/admin/${competitionId}?tab=${tab.key}`}
            className={`admin-tab${activeTab === tab.key ? " active" : ""}`}
          >
            <Icon size={16} />
            {tab.label}
            {badge !== null ? (
              <span className="admin-tab-badge">{badge}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
