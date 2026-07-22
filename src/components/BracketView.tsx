import { Trophy } from "lucide-react";
import { TeamLabel } from "@/components/TeamLabel";
import { flattenSide, winnerSide, type Bracket, type BracketMatch } from "@/lib/bracket";
import { formatAppDate } from "@/lib/timezone";

export function BracketView({ bracket }: { bracket: Bracket }) {
  const depth = bracket.rounds.length - 1;
  const roundNames = bracket.rounds.slice(0, depth);
  const [leftFeeder, rightFeeder] = bracket.final.feeders;
  const left = flattenSide(leftFeeder, depth);
  const right = flattenSide(rightFeeder, depth);

  return (
    <div className="bracket-scroll">
      <div className="bracket">
        <BracketSide columns={left} roundNames={roundNames} />

        <div className="bracket-center">
          <span className="bracket-round">{bracket.rounds.at(-1)}</span>
          <span className="bracket-trophy"><Trophy size={26} /></span>
          <MatchCard match={bracket.final.match} champion />
          {bracket.thirdPlace ? (
            <>
              <span className="bracket-round third">{bracket.thirdPlace.round}</span>
              <MatchCard match={bracket.thirdPlace.match} />
            </>
          ) : null}
        </div>

        <BracketSide columns={right} roundNames={roundNames} mirrored />
      </div>
    </div>
  );
}

function BracketSide({
  columns,
  roundNames,
  mirrored = false,
}: {
  columns: BracketMatch[][];
  roundNames: string[];
  mirrored?: boolean;
}) {
  return (
    <div className={mirrored ? "bracket-side mirrored" : "bracket-side"}>
      {columns.map((matches, index) => (
        <div className="bracket-column" key={roundNames[index] ?? index}>
          <span className="bracket-round">{roundNames[index]}</span>
          <div className="bracket-column-body">
            {pairs(matches).map((pair, pairIndex) => (
              <div className="bracket-pair" key={pair[0]?.id ?? pairIndex}>
                {pair.map((match) => (
                  <div className="bracket-slot" key={match.id}>
                    <MatchCard match={match} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Los partidos vienen en orden de alimentacion, asi que cada dos forman una llave. */
function pairs(matches: BracketMatch[]) {
  const result: BracketMatch[][] = [];
  for (let index = 0; index < matches.length; index += 2) {
    result.push(matches.slice(index, index + 2));
  }
  return result;
}

function MatchCard({ match, champion = false }: { match: BracketMatch; champion?: boolean }) {
  const winner = winnerSide(match);
  return (
    <article className={champion ? "bracket-card champion" : "bracket-card"}>
      <BracketTeamRow match={match} side="HOME" winner={winner} />
      <BracketTeamRow match={match} side="AWAY" winner={winner} />
      <small>
        {match.status === "LIVE"
          ? "En vivo"
          : match.kickoffAt
            ? formatAppDate(match.kickoffAt)
            : "Fecha por definir"}
      </small>
    </article>
  );
}

function BracketTeamRow({
  match,
  side,
  winner,
}: {
  match: BracketMatch;
  side: "HOME" | "AWAY";
  winner: "HOME" | "AWAY" | null;
}) {
  const team = side === "HOME" ? match.homeTeam : match.awayTeam;
  const placeholder = side === "HOME" ? match.homePlaceholder : match.awayPlaceholder;
  const score = side === "HOME" ? match.homeScore : match.awayScore;
  const classNames = ["bracket-team"];
  if (winner === side) classNames.push("winner");
  if (winner && winner !== side) classNames.push("loser");
  if (!team) classNames.push("pending");

  return (
    <div className={classNames.join(" ")}>
      {team ? (
        <TeamLabel name={team.name} logoUrl={team.logoUrl} compact />
      ) : (
        <span className="bracket-pending-name">{placeholder ?? "Por definir"}</span>
      )}
      <strong>{score ?? "-"}</strong>
    </div>
  );
}
