/**
 * Duration statistics of a game, as the API returns them (aggregates only): «A tua média» from the viewer's
 * matches and «Média MeepleBoard» from matches every participant shares. A community group below the minimum
 * protection carries only `available: false`. Community values are rounded to 5 minutes.
 */
export type DurationStats = {
  available: boolean;
  count: number;
  measured: number;
  estimated: number;
  notStated: number;
  mean?: number | null;
  median?: number | null;
  q1?: number | null;
  q3?: number | null;
  distant: number;
  /** Only for your own matches. */
  distantValues?: number[] | null;
  excludedUnknown?: number | null;
  excludedMissing?: number | null;
  excludedZero?: number | null;
};

export type DurationSide = { solo: DurationStats; multiplayer: DurationStats; byPlayers: { players: number; stats: DurationStats }[] };

export type GameDurations = { personal: DurationSide; community: DurationSide; viewerContributes: boolean };

/** One faithful word for the method: all of one kind, or «métodos mistos». Old durations are never «estimated». */
export function methodLabel(s: DurationStats): "measured" | "estimated" | "notStated" | "mixed" {
  const kinds = [s.measured > 0, s.estimated > 0, s.notStated > 0].filter(Boolean).length;
  if (kinds > 1) return "mixed";
  return s.measured ? "measured" : s.estimated ? "estimated" : "notStated";
}
