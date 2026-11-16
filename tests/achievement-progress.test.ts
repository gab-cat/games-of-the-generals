import { describe, expect, test } from "bun:test";
import { percentOf, progressFor, ribbonStripes } from "../src/pages/achievements/progress";

describe("progressFor", () => {
  const stats = { wins: 7, gamesPlayed: 12, winStreak: 2, capturedFlags: 30, spiesRevealed: 4, piecesEliminated: 61 };

  test("counts toward win and game milestones", () => {
    expect(progressFor("wins_10", stats)).toEqual({ current: 7, target: 10, unit: "wins" });
    expect(progressFor("games_played_50", stats)).toEqual({ current: 12, target: 50, unit: "games" });
  });

  test("ranks use the same win thresholds as the server", () => {
    expect(progressFor("rank_captain", stats)?.target).toBe(10);
    expect(progressFor("rank_general", stats)?.target).toBe(50);
  });

  test("caps at the target", () => {
    expect(progressFor("flag_hunter", stats)).toEqual({ current: 10, target: 10, unit: "flags" });
  });

  test("one-game feats and missing stats have no count", () => {
    expect(progressFor("fast_win_5min", stats)).toBeNull();
    expect(progressFor("perfectionist", stats)).toBeNull();
    expect(progressFor("wins_10", null)).toBeNull();
    expect(progressFor("wins_10", {})).toEqual({ current: 0, target: 10, unit: "wins" });
  });

  test("percentOf", () => {
    expect(percentOf({ current: 7, target: 10, unit: "wins" })).toBe(70);
    expect(percentOf(null)).toBe(0);
  });
});

describe("ribbonStripes", () => {
  test("is the same for the same id and differs between ids", () => {
    expect(ribbonStripes("first_win")).toBe(ribbonStripes("first_win"));
    expect(ribbonStripes("first_win")).not.toBe(ribbonStripes("wins_10"));
    expect(ribbonStripes("wins_10").startsWith("linear-gradient(90deg,")).toBe(true);
  });
});
