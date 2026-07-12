"use client";

import type { DisplayMatch } from "@/lib/match-ui";
import { roomMarketCatalog, type RoomMarketKey } from "@/lib/room-presets";

type MarketAnswerValue = Record<string, unknown>;

function stringValue(value: MarketAnswerValue | undefined, key: string) {
  const raw = value?.[key];
  return typeof raw === "string" || typeof raw === "number" ? String(raw) : "";
}

function optionName(match: DisplayMatch, side: "HOME" | "AWAY") {
  return side === "HOME" ? match.home : match.away;
}

function marketFieldName(market: RoomMarketKey, matchId: string, field: string) {
  return `market:${market}:${matchId}:${field}`;
}

const goalRangeOptions = [
  ["0-1", "0-1"],
  ["2-3", "2-3"],
  ["4-5", "4-5"],
  ["6+", "6+"],
];

const firstGoalMinuteOptions = [
  ["NO_GOAL", "Sin gol"],
  ["1-15", "1-15"],
  ["16-30", "16-30"],
  ["31-45_PLUS", "31-45+"],
  ["46-60", "46-60"],
  ["61-75", "61-75"],
  ["76-90_PLUS", "76-90+"],
  ["EXTRA_TIME", "Tiempo extra"],
];

const yellowCardRangeOptions = [
  ["0-2", "0-2"],
  ["3-4", "3-4"],
  ["5-6", "5-6"],
  ["7+", "7+"],
];

const cornerRangeOptions = [
  ["0-6", "0-6"],
  ["7-9", "7-9"],
  ["10-12", "10-12"],
  ["13+", "13+"],
];

export function RoomMarketFields({
  match,
  markets,
  answers,
}: {
  match: DisplayMatch;
  markets: RoomMarketKey[];
  answers: Partial<Record<RoomMarketKey, MarketAnswerValue>>;
}) {
  if (markets.length === 0) return null;

  return (
    <div className="room-market-fields">
      {markets.map((market) => {
        const definition = roomMarketCatalog.find((item) => item.key === market);
        if (!definition) return null;

        return (
          <fieldset className="room-market-pick" key={market}>
            <legend>{definition.label}</legend>
            <MarketInput market={market} match={match} value={answers[market]} />
          </fieldset>
        );
      })}
    </div>
  );
}

function MarketInput({
  market,
  match,
  value,
}: {
  market: RoomMarketKey;
  match: DisplayMatch;
  value?: MarketAnswerValue;
}) {
  if (market === "HALFTIME_SCORE") {
    return (
      <div className="room-market-score-inputs">
        <input
          type="number"
          min="0"
          name={marketFieldName(market, match.id, "home")}
          defaultValue={stringValue(value, "home")}
          aria-label={`${match.home} al descanso`}
        />
        <span>:</span>
        <input
          type="number"
          min="0"
          name={marketFieldName(market, match.id, "away")}
          defaultValue={stringValue(value, "away")}
          aria-label={`${match.away} al descanso`}
        />
      </div>
    );
  }

  if (
    market === "BOTH_TEAMS_SCORE" ||
    market === "PENALTY_IN_MATCH" ||
    market === "PENALTY_SCORED" ||
    market === "RED_CARD_IN_MATCH" ||
    market === "EXTRA_TIME" ||
    market === "PENALTY_SHOOTOUT" ||
    market === "COMEBACK_WIN" ||
    market === "GOAL_IN_BOTH_HALVES"
  ) {
    return (
      <select name={marketFieldName(market, match.id, "value")} defaultValue={stringValue(value, "value")}>
        <option value="">Sin pick</option>
        <option value="YES">Si</option>
        <option value="NO">No</option>
      </select>
    );
  }

  if (
    market === "HALFTIME_RESULT" ||
    market === "SECOND_HALF_RESULT"
  ) {
    return (
      <select name={marketFieldName(market, match.id, "value")} defaultValue={stringValue(value, "value")}>
        <option value="">Sin pick</option>
        <option value="HOME">{optionName(match, "HOME")}</option>
        <option value="DRAW">Empate</option>
        <option value="AWAY">{optionName(match, "AWAY")}</option>
      </select>
    );
  }

  if (market === "DOUBLE_CHANCE") {
    return (
      <select name={marketFieldName(market, match.id, "value")} defaultValue={stringValue(value, "value")}>
        <option value="">Sin pick</option>
        <option value="HOME_DRAW">{optionName(match, "HOME")} o empate</option>
        <option value="HOME_AWAY">{optionName(match, "HOME")} o {optionName(match, "AWAY")}</option>
        <option value="DRAW_AWAY">Empate o {optionName(match, "AWAY")}</option>
      </select>
    );
  }

  if (market === "OVER_UNDER_2_5") {
    return (
      <select name={marketFieldName(market, match.id, "value")} defaultValue={stringValue(value, "value")}>
        <option value="">Sin pick</option>
        <option value="OVER_2_5">Mas de 2.5</option>
        <option value="UNDER_2_5">Menos de 2.5</option>
      </select>
    );
  }

  if (market === "ODD_EVEN_TOTAL_GOALS") {
    return (
      <select name={marketFieldName(market, match.id, "value")} defaultValue={stringValue(value, "value")}>
        <option value="">Sin pick</option>
        <option value="EVEN">Par</option>
        <option value="ODD">Impar</option>
      </select>
    );
  }

  if (market === "HIGHEST_SCORING_HALF") {
    return (
      <select name={marketFieldName(market, match.id, "value")} defaultValue={stringValue(value, "value")}>
        <option value="">Sin pick</option>
        <option value="FIRST_HALF">Primer tiempo</option>
        <option value="SECOND_HALF">Segundo tiempo</option>
        <option value="EQUAL">Igual cantidad</option>
      </select>
    );
  }

  if (
    market === "FIRST_GOAL_TEAM" ||
    market === "LAST_GOAL_TEAM" ||
    market === "CLEAN_SHEET" ||
    market === "WIN_TO_NIL" ||
    market === "PENALTY_AWARDED_TEAM" ||
    market === "RED_CARD_TEAM" ||
    market === "TEAM_MOST_CORNERS" ||
    market === "TEAM_MOST_CARDS"
  ) {
    return (
      <select name={marketFieldName(market, match.id, "side")} defaultValue={stringValue(value, "side")}>
        <option value="">Sin pick</option>
        <option value="HOME">{optionName(match, "HOME")}</option>
        <option value="AWAY">{optionName(match, "AWAY")}</option>
        <option value="NONE">Ninguno</option>
      </select>
    );
  }

  if (market === "TEAM_TOTAL_GOALS") {
    return (
      <div className="room-market-combo">
        <select name={marketFieldName(market, match.id, "side")} defaultValue={stringValue(value, "side")}>
          <option value="">Equipo</option>
          <option value="HOME">{optionName(match, "HOME")}</option>
          <option value="AWAY">{optionName(match, "AWAY")}</option>
        </select>
        <input
          type="number"
          min="0"
          name={marketFieldName(market, match.id, "total")}
          defaultValue={stringValue(value, "total")}
          aria-label="Goles del equipo"
        />
      </div>
    );
  }

  if (market === "WIN_MARGIN" || market === "EXACT_TOTAL_GOALS") {
    return (
      <input
        type="number"
        min="0"
        name={marketFieldName(market, match.id, "value")}
        defaultValue={stringValue(value, "value")}
        placeholder={market === "WIN_MARGIN" ? "Diferencia" : "Total"}
      />
    );
  }

  if (market === "TOTAL_GOALS") {
    return <RangeSelect market={market} matchId={match.id} value={value} options={goalRangeOptions} />;
  }

  if (market === "FIRST_GOAL_MINUTE_RANGE") {
    return <RangeSelect market={market} matchId={match.id} value={value} options={firstGoalMinuteOptions} />;
  }

  if (market === "YELLOW_CARD_RANGE") {
    return <RangeSelect market={market} matchId={match.id} value={value} options={yellowCardRangeOptions} />;
  }

  if (market === "TOTAL_CORNERS_RANGE") {
    return <RangeSelect market={market} matchId={match.id} value={value} options={cornerRangeOptions} />;
  }

  if (market === "PLAYER_FIRST_GOAL") {
    return (
      <input
        name={marketFieldName(market, match.id, "value")}
        defaultValue={stringValue(value, "value")}
        placeholder="Nombre del jugador"
      />
    );
  }

  return null;
}

function RangeSelect({
  market,
  matchId,
  value,
  options,
}: {
  market: RoomMarketKey;
  matchId: string;
  value?: MarketAnswerValue;
  options: string[][];
}) {
  return (
    <select name={marketFieldName(market, matchId, "value")} defaultValue={stringValue(value, "value")}>
      <option value="">Sin pick</option>
      {options.map(([optionValue, label]) => (
        <option value={optionValue} key={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}
