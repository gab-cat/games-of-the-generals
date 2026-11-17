// Cursor for getMatchHistory. A player's finished games come from two index
// ranges (as player 1 and as player 2), so the cursor is a position in time,
// not a document id: the next page holds games that finished before `before`.
// `seen` counts games already shown, so the tier's replay limit (Free 1,
// Pro 50, Pro+ 100) applies across pages rather than to each page.
export type HistoryCursor = { before: number; seen: number };

export function encodeHistoryCursor(cursor: HistoryCursor): string {
  return `${cursor.before}:${cursor.seen}`;
}

// Anything else (no cursor, or an id-style cursor from an older client)
// starts from the newest game.
export function decodeHistoryCursor(
  raw: string | undefined | null,
): HistoryCursor | null {
  if (!raw) return null;
  const match = /^(\d+):(\d+)$/.exec(raw);
  if (!match) return null;
  return { before: Number(match[1]), seen: Number(match[2]) };
}

// Newest first; ties broken by id so the order is stable between calls.
export function mergeNewestFirst<T extends { _id: string; finishedAt?: number }>(
  a: T[],
  b: T[],
): T[] {
  return [...a, ...b].sort((x, y) => {
    const diff = (y.finishedAt ?? 0) - (x.finishedAt ?? 0);
    if (diff !== 0) return diff;
    return y._id.localeCompare(x._id);
  });
}

// Picks one page out of the merged candidates. Each side was read with
// take(limit + 1), which is enough: the newest limit + 1 games overall come
// from at most limit + 1 on either side.
export function pickHistoryPage<T extends { _id: string; finishedAt?: number }>(
  merged: T[],
  limit: number,
  seen: number,
  maxReplays: number,
): { page: T[]; continueCursor: string | null } {
  const page = merged.slice(0, limit);
  const last = page[page.length - 1];
  const shown = seen + page.length;
  const hasMore =
    merged.length > limit &&
    shown < maxReplays &&
    last !== undefined &&
    last.finishedAt !== undefined;
  return {
    page,
    continueCursor: hasMore
      ? encodeHistoryCursor({ before: last.finishedAt!, seen: shown })
      : null,
  };
}
