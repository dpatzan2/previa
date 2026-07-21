import { flagUrlForTeam } from "@/lib/flags";

export function TeamLabel({
  name,
  compact = false,
  logoUrl,
}: {
  name: string;
  compact?: boolean;
  logoUrl?: string | null;
}) {
  const flagUrl = logoUrl ?? flagUrlForTeam(name);

  return (
    <span className={compact ? "team-label compact" : "team-label"}>
      {flagUrl ? (
        <img
          className="team-flag"
          src={flagUrl}
          alt={`Escudo de ${name}`}
        />
      ) : (
        <span className="team-flag placeholder" aria-hidden="true" />
      )}
      <span title={name}>{name}</span>
    </span>
  );
}
