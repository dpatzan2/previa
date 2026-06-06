import Image from "next/image";
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
        <Image
          className="team-flag"
          src={flagUrl}
          alt={`Bandera de ${name}`}
          width={28}
          height={20}
          unoptimized
        />
      ) : (
        <span className="team-flag placeholder" aria-hidden="true" />
      )}
      <span>{name}</span>
    </span>
  );
}
