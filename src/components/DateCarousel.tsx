"use client";

import { useEffect, useRef } from "react";
import type { MatchDateTab } from "@/lib/match-ui";
import { formatCarouselDayParts } from "@/lib/timezone";

type DateCarouselProps = {
  tabs: MatchDateTab[];
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
};

export function DateCarousel({ tabs, selectedDateKey, onSelect }: DateCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const active = activeRef.current;
    if (!container || !active) return;
    const target = active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: "auto" });
  }, [selectedDateKey]);

  return (
    <div className="date-carousel" role="tablist" aria-label="Fechas con partidos" ref={containerRef}>
      {tabs.map((tab) => {
        const isActive = tab.dateKey === selectedDateKey;

        if (!tab.kickoffAt) {
          return (
            <button
              key={tab.dateKey}
              ref={isActive ? activeRef : undefined}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? "date-tab active" : "date-tab"}
              onClick={() => onSelect(tab.dateKey)}
            >
              <span className="date-tab-weekday">Por</span>
              <span className="date-tab-day">--</span>
              <span className="date-tab-month">confirmar</span>
            </button>
          );
        }

        const parts = formatCarouselDayParts(tab.kickoffAt);

        return (
          <button
            key={tab.dateKey}
            ref={isActive ? activeRef : undefined}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`date-tab${isActive ? " active" : ""}${parts.isToday ? " today" : ""}`}
            onClick={() => onSelect(tab.dateKey)}
          >
            <span className="date-tab-weekday">{parts.isToday ? "HOY" : parts.weekdayShort}</span>
            <span className="date-tab-day">{parts.dayNumber}</span>
            <span className="date-tab-month">{parts.monthShort}</span>
          </button>
        );
      })}
    </div>
  );
}

type DateStatsRowProps = {
  total: number;
  predicted: number;
  live: number;
};

export function DateStatsRow({ total, predicted, live }: DateStatsRowProps) {
  return (
    <div className="date-stats-row">
      <span className="date-stat">
        Partidos <strong className="date-stat-count">{total}</strong>
      </span>
      <span className="date-stat">
        Pronosticados <strong className="date-stat-count">{predicted}</strong>
      </span>
      {live > 0 ? (
        <span className="date-stat">
          En vivo <strong className="date-stat-count live">{live}</strong>
        </span>
      ) : null}
    </div>
  );
}
