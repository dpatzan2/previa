"use client";

import { useEffect, useState } from "react";

export function CalendarSyncButtons({
  competitionId,
  competitionName,
}: {
  competitionId: string;
  competitionName: string;
}) {
  const [origin, setOrigin] = useState("");
  const [host, setHost] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    setHost(window.location.host);
  }, []);

  if (!origin) {
    return (
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          className="primary-button compact"
          style={{ height: "32px", fontSize: "0.78rem", padding: "0 10px", background: "#4285f4", color: "#fff", borderRadius: "6px" }}
          disabled
        >
          Google Calendar
        </button>
        <button
          className="primary-button compact"
          style={{ height: "32px", fontSize: "0.78rem", padding: "0 10px", background: "#0078d4", color: "#fff", borderRadius: "6px" }}
          disabled
        >
          Outlook
        </button>
        <button
          className="ghost-button compact"
          style={{ height: "32px", fontSize: "0.78rem", padding: "0 10px", borderRadius: "6px" }}
          disabled
        >
          Apple / iCal
        </button>
        <button
          className="ghost-button compact"
          style={{ height: "32px", fontSize: "0.78rem", padding: "0 10px", borderRadius: "6px" }}
          disabled
        >
          Descargar .ics
        </button>
      </div>
    );
  }

  const feedUrl = `${origin}/api/calendar/${competitionId}`;
  const googleUrl = `https://www.google.com/calendar/render?cid=${encodeURIComponent(feedUrl)}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/addcalendar?url=${encodeURIComponent(feedUrl)}`;
  const appleUrl = `webcal://${host}/api/calendar/${competitionId}`;
  const downloadUrl = `/api/calendar/${competitionId}`;

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="primary-button compact"
        style={{
          height: "32px",
          fontSize: "0.78rem",
          padding: "0 10px",
          background: "#4285f4",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "6px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Google Calendar
      </a>
      <a
        href={outlookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="primary-button compact"
        style={{
          height: "32px",
          fontSize: "0.78rem",
          padding: "0 10px",
          background: "#0078d4",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "6px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Outlook
      </a>
      <a
        href={appleUrl}
        className="ghost-button compact"
        style={{
          height: "32px",
          fontSize: "0.78rem",
          padding: "0 10px",
          textDecoration: "none",
          borderRadius: "6px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Apple / iCal
      </a>
      <a
        href={downloadUrl}
        download={`${competitionName}.ics`}
        className="ghost-button compact"
        style={{
          height: "32px",
          fontSize: "0.78rem",
          padding: "0 10px",
          textDecoration: "none",
          borderRadius: "6px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Descargar .ics
      </a>
    </div>
  );
}
