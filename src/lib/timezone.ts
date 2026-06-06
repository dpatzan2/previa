export const APP_TIMEZONE = "America/Guatemala";
export const APP_LOCALE = "es-GT";

/** Interpreta fechas del fixture como hora local de Guatemala cuando no traen zona. */
export function parseAppDateTime(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (/[zZ]$/.test(normalized) || /[+-]\d{2}:\d{2}$/.test(normalized)) {
    return new Date(normalized);
  }
  return new Date(`${normalized}-06:00`);
}

export function formatAppDateTime(date: Date) {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatAppTime(date: Date) {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatAppDate(date: Date) {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** Etiquetas legibles desde kickoffAt; si no hay, usa las del fixture. */
export function matchScheduleLabels(
  kickoffAt: Date | null | undefined,
  dateLabel: string | null | undefined,
  timeLabel: string | null | undefined,
) {
  if (!kickoffAt) {
    return { dateLabel: dateLabel ?? null, timeLabel: timeLabel ?? null };
  }

  return {
    dateLabel: formatAppDate(kickoffAt),
    timeLabel: formatAppTime(kickoffAt),
  };
}
