"use client";

import Link from "next/link";
import { ClipboardList, Trophy, Settings, Info } from "lucide-react";

export function RoomHeader({
  roomId,
  roomName,
  accessCode,
  activeTab,
  canManage,
}: {
  roomId: string;
  roomName: string;
  accessCode: string;
  activeTab: "info" | "picks" | "leaderboard" | "settings";
  canManage: boolean;
}) {
  return (
    <div className="room-nav-header">
      <header className="page-header detail-header" style={{ marginBottom: "12px" }}>
        <div>
          <span className="eyebrow">Sala</span>
          <h1 style={{ margin: 0 }}>{roomName}</h1>
        </div>
        <div className="detail-score room-code-box">
          <span>Código</span>
          <strong>{accessCode}</strong>
        </div>
      </header>

      <nav className="room-nav-tabs">
        <Link href={`/rooms/${roomId}`} className={`room-nav-tab${activeTab === "info" ? " active" : ""}`}>
          <Info size={16} />
          <span>Información</span>
        </Link>
        <Link href={`/rooms/${roomId}/picks`} className={`room-nav-tab${activeTab === "picks" ? " active" : ""}`}>
          <ClipboardList size={16} />
          <span>Pronósticos</span>
        </Link>
        <Link href={`/rooms/${roomId}/leaderboard`} className={`room-nav-tab${activeTab === "leaderboard" ? " active" : ""}`}>
          <Trophy size={16} />
          <span>Tabla</span>
        </Link>
        {canManage ? (
          <Link href={`/rooms/${roomId}/settings`} className={`room-nav-tab${activeTab === "settings" ? " active" : ""}`}>
            <Settings size={16} />
            <span>Ajustes</span>
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
