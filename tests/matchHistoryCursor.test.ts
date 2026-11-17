import { describe, expect, test } from "bun:test";
import {
  decodeHistoryCursor,
  encodeHistoryCursor,
  mergeNewestFirst,
  pickHistoryPage,
} from "../convex/lib/matchHistoryCursor";

type Game = { _id: string; finishedAt?: number; seat: 1 | 2 };

// 60 games alternating seats, with random-looking ids so id order and time
// order disagree, as they do in Convex.
const games: Game[] = Array.from({ length: 60 }, (_, i) => ({
  _id: ((i * 7919) % 1000).toString(36).padStart(4, "z") + i,
  finishedAt: 1_700_000_000_000 + i * 60_000,
  seat: i % 3 === 0 ? 2 : 1,
}));

// Mirrors getMatchHistory: each seat's index range, newest first, from the
// cursor, take(limit + 1).
function readPage(cursorRaw: string | null, numItems: number, maxReplays: number) {
  const cursor = decodeHistoryCursor(cursorRaw);
  const seen = cursor?.seen ?? 0;
  const limit = Math.min(numItems, 20, Math.max(0, maxReplays - seen));
  if (limit === 0) return { page: [] as Game[], continueCursor: null };
  const side = (seat: 1 | 2) =>
    games
      .filter((g) => g.seat === seat)
      .filter((g) => !cursor || (g.finishedAt ?? 0) < cursor.before)
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
      .slice(0, limit + 1);
  return pickHistoryPage(mergeNewestFirst(side(1), side(2)), limit, seen, maxReplays);
}

function readAll(numItems: number, maxReplays: number) {
  const pages: Game[][] = [];
  let cursor: string | null = null;
  do {
    const { page, continueCursor } = readPage(cursor, numItems, maxReplays);
    pages.push(page);
    cursor = continueCursor;
  } while (cursor && pages.length < 50);
  return pages;
}

describe("match history paging", () => {
  test("pages are newest first, never repeat, and reach older games", () => {
    const pages = readAll(8, 100);
    const ids = pages.flat().map((g) => g._id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(60);
    const times = pages.flat().map((g) => g.finishedAt!);
    expect(times).toEqual([...times].sort((a, b) => b - a));
    expect(pages.every((p) => p.length <= 8)).toBe(true);
  });

  test("the tier limit applies across pages", () => {
    expect(readAll(8, 50).flat().length).toBe(50);
    expect(readAll(8, 1).flat().length).toBe(1);
  });

  test("the last page has no cursor", () => {
    const pages = readAll(20, 100);
    expect(pages.length).toBe(3);
    expect(readPage(null, 20, 100).continueCursor).not.toBeNull();
  });
});

describe("cursor format", () => {
  test("round-trips", () => {
    const c = { before: 1_700_000_123_456, seen: 16 };
    expect(decodeHistoryCursor(encodeHistoryCursor(c))).toEqual(c);
  });

  test("old id-style cursors start from the newest game", () => {
    expect(decodeHistoryCursor("j57abc123def")).toBeNull();
    expect(decodeHistoryCursor(undefined)).toBeNull();
    expect(decodeHistoryCursor("")).toBeNull();
  });
});
