import { flagUrlForTeam } from "@/lib/flags";

export function TeamLabel({
  name,
  compact = false,
}: {
  name: string;
  compact?: boolean;
}) {
  const flagUrl = flagUrlForTeam(name);

  return (
    <span className={compact ? "team-label compact" : "team-label"}>
      {flagUrl ? (
        <img
          className="team-flag"
          src={flagUrl}
          alt={`Escudo de ${name}`}
          style={{ width: "28px", height: "20px", objectFit: "contain", flexShrink: 0 }}
        />
      ) : (
        <span className="team-flag placeholder" aria-hidden="true" />
      )}
      <span>{name}</span>
    </span>
  );
}
