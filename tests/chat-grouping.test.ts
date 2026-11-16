import { describe, expect, test } from "bun:test";
import {
  GROUP_WINDOW_MS,
  formatDayLabel,
  groupChatMessages,
  newMessagesLabel,
  splitMentions,
} from "../src/lib/chat-grouping";

const NOW = new Date(2026, 10, 17, 15, 0).getTime();
const min = 60_000;
const m = (key: string, userId: string | undefined, timestamp: number) => ({
  key,
  userId,
  timestamp,
});

describe("groupChatMessages", () => {
  test("runs of one sender share a group, a new sender starts one", () => {
    const items = groupChatMessages(
      [m("1", "a", NOW - 10 * min), m("2", "a", NOW - 9 * min), m("3", "b", NOW - 8 * min)],
      NOW,
    );
    expect(items.map((i) => i.kind)).toEqual(["day", "group", "group"]);
    const [, first, second] = items;
    expect(first.kind === "group" && first.messages.map((x) => x.key)).toEqual(["1", "2"]);
    expect(second.kind === "group" && second.messages.map((x) => x.key)).toEqual(["3"]);
  });

  test("a gap longer than the window breaks the run", () => {
    const items = groupChatMessages(
      [m("1", "a", NOW - 20 * min), m("2", "a", NOW - 20 * min + GROUP_WINDOW_MS + 1)],
      NOW,
    );
    expect(items.filter((i) => i.kind === "group")).toHaveLength(2);
  });

  test("a gap of exactly the window keeps the run", () => {
    const items = groupChatMessages(
      [m("1", "a", NOW - 20 * min), m("2", "a", NOW - 20 * min + GROUP_WINDOW_MS)],
      NOW,
    );
    expect(items.filter((i) => i.kind === "group")).toHaveLength(1);
  });

  test("midnight adds a day divider and breaks the run", () => {
    const midnight = new Date(2026, 10, 17, 0, 0).getTime();
    const items = groupChatMessages(
      [m("1", "a", midnight - min), m("2", "a", midnight + min)],
      NOW,
    );
    expect(items.map((i) => (i.kind === "day" ? i.label : "group"))).toEqual([
      "Yesterday",
      "group",
      "Today",
      "group",
    ]);
  });

  test("messages without a sender never merge", () => {
    const items = groupChatMessages(
      [m("1", undefined, NOW - 2 * min), m("2", undefined, NOW - min)],
      NOW,
    );
    expect(items.filter((i) => i.kind === "group")).toHaveLength(2);
  });

  test("empty input gives no items", () => {
    expect(groupChatMessages([], NOW)).toEqual([]);
  });
});

describe("formatDayLabel", () => {
  test("today and yesterday by name", () => {
    expect(formatDayLabel(NOW - min, NOW)).toBe("Today");
    expect(formatDayLabel(NOW - 24 * 60 * min, NOW)).toBe("Yesterday");
  });

  test("older dates in another year show the year", () => {
    expect(formatDayLabel(new Date(2025, 9, 28).getTime(), NOW)).toContain("2025");
    expect(formatDayLabel(new Date(2026, 9, 28).getTime(), NOW)).not.toContain("2026");
  });
});

describe("splitMentions", () => {
  test("only names the server resolved become mentions", () => {
    expect(splitMentions("hi @Ana and @ghost", ["ana"])).toEqual([
      { text: "hi " },
      { text: "@Ana", mention: "Ana" },
      { text: " and " },
      { text: "@ghost" },
    ]);
  });

  test("without a resolved list every @word is a mention", () => {
    expect(splitMentions("@ana-b ok", undefined)).toEqual([
      { text: "@ana-b", mention: "ana-b" },
      { text: " ok" },
    ]);
  });
});

test("newMessagesLabel plurals", () => {
  expect(newMessagesLabel(1)).toBe("1 new message");
  expect(newMessagesLabel(3)).toBe("3 new messages");
});
