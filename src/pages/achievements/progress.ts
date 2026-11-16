/*
 * How far a player is toward each achievement, from their profile stats.
 * The thresholds mirror `checkAchievements` in convex/achievements.ts; keep
 * them in step. Achievements won in a single game (a fast win, a flawless
 * win) have no count, so they return null.
 */

export type ProfileStats = {
  wins?: number;
  gamesPlayed?: number;
  winStreak?: number;
  capturedFlags?: number;
  spiesRevealed?: number;
  piecesEliminated?: number;
};

export type Progress = { current: number; target: number; unit: string };

const RULES: Record<string, { stat: keyof ProfileStats; target: number; unit: string }> = {
  first_win: { stat: "wins", target: 1, unit: "wins" },
  wins_10: { stat: "wins", target: 10, unit: "wins" },
  wins_25: { stat: "wins", target: 25, unit: "wins" },
  wins_50: { stat: "wins", target: 50, unit: "wins" },
  wins_100: { stat: "wins", target: 100, unit: "wins" },
  games_played_10: { stat: "gamesPlayed", target: 10, unit: "games" },
  games_played_50: { stat: "gamesPlayed", target: 50, unit: "games" },
  games_played_100: { stat: "gamesPlayed", target: 100, unit: "games" },
  // Ranks come from wins (convex/profiles.ts)
  rank_sergeant: { stat: "wins", target: 3, unit: "wins" },
  rank_lieutenant: { stat: "wins", target: 5, unit: "wins" },
  rank_captain: { stat: "wins", target: 10, unit: "wins" },
  rank_major: { stat: "wins", target: 20, unit: "wins" },
  rank_colonel: { stat: "wins", target: 30, unit: "wins" },
  rank_general: { stat: "wins", target: 50, unit: "wins" },
  // Streaks count the current run of wins
  win_streak_3: { stat: "winStreak", target: 3, unit: "wins in a row" },
  win_streak_5: { stat: "winStreak", target: 5, unit: "wins in a row" },
  win_streak_10: { stat: "winStreak", target: 10, unit: "wins in a row" },
  flag_hunter: { stat: "capturedFlags", target: 10, unit: "flags" },
  flag_master: { stat: "capturedFlags", target: 25, unit: "flags" },
  spy_master: { stat: "spiesRevealed", target: 25, unit: "pieces revealed" },
  spy_legend: { stat: "spiesRevealed", target: 50, unit: "pieces revealed" },
  eliminator: { stat: "piecesEliminated", target: 50, unit: "pieces" },
  destroyer: { stat: "piecesEliminated", target: 100, unit: "pieces" },
};

/** Progress toward a locked achievement, or null when it has no count. */
export function progressFor(id: string, stats: ProfileStats | null | undefined): Progress | null {
  const rule = RULES[id];
  if (!rule || !stats) return null;
  const current = Math.max(0, Math.min(rule.target, stats[rule.stat] ?? 0));
  return { current, target: rule.target, unit: rule.unit };
}

/** 0 to 100. */
export function percentOf(p: Progress | null): number {
  if (!p || p.target <= 0) return 0;
  return Math.round((p.current / p.target) * 100);
}

/* ------------------------------------------------------------------ */
/* Ribbon stripes: a symmetric pattern that always comes out the same   */
/* for the same achievement id.                                         */
/* ------------------------------------------------------------------ */

// Gold, the two armies, off-white, near-black, and their deep tones.
const PALETTE = ["#d9a441", "#3b82f6", "#ef4b40", "#f3ead8", "#17110a", "#1e3a8a", "#8f1d16", "#7a5a1c"];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function ribbonStripes(id: string): string {
  let h = hash(id);
  const next = (n: number) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    return h % n;
  };
  const base = PALETTE[next(PALETTE.length)];
  const bands: Array<[string, number]> = [];
  const count = 2 + next(3);
  for (let i = 0; i < count; i++) {
    let c = PALETTE[next(PALETTE.length)];
    if (c === base) c = PALETTE[(PALETTE.indexOf(c) + 3) % PALETTE.length];
    bands.push([c, 3 + next(9)]);
  }
  // Half the pattern, edge to centre: the base field then the bands. Mirrored.
  const half: Array<[string, number]> = [[base, 8 + next(10)], ...bands];
  const total = half.reduce((a, [, w]) => a + w, 0);
  const scale = 50 / Math.max(total, 50);
  let at = 0;
  const stops: string[] = [];
  for (const [c, w] of half) {
    const end = at + w * scale;
    stops.push(`${c} ${at.toFixed(2)}% ${end.toFixed(2)}%`);
    at = end;
  }
  stops.push(`${base} ${at.toFixed(2)}% ${(100 - at).toFixed(2)}%`);
  for (const [c, w] of [...half].reverse()) {
    const start = 100 - at;
    const end = start + w * scale;
    stops.push(`${c} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
    at -= w * scale;
  }
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}
