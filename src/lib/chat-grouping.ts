/**
 * Turns a flat, oldest-first list of chat messages into what the chat panel
 * draws: day dividers, then runs of messages from one sender. A run breaks
 * when the sender changes, when more than `GROUP_WINDOW_MS` passes between
 * two messages, or at midnight. The first message of a run shows the avatar,
 * name and time; the rest show only their text.
 */

/** Messages from one sender this close together share one header. */
export const GROUP_WINDOW_MS = 5 * 60 * 1000;

export interface GroupableMessage {
  /** Stable key: the Convex id, or the optimistic id while sending. */
  key: string;
  userId?: string;
  timestamp: number;
}

export type ChatItem<M extends GroupableMessage> =
  | { kind: "day"; key: string; label: string }
  | { kind: "group"; key: string; userId?: string; messages: M[] };

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "Today", "Yesterday", "Tue, Nov 10", or "Oct 28, 2025" in another year. */
export function formatDayLabel(ts: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  const d = new Date(ts);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  if (days < 7 && days > 0) {
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** "3:07 PM" in the viewer's locale. */
export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Full date and time, for the hover title. */
export function formatFull(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function groupChatMessages<M extends GroupableMessage>(
  messages: M[],
  now = Date.now(),
  windowMs = GROUP_WINDOW_MS,
): ChatItem<M>[] {
  const items: ChatItem<M>[] = [];
  let currentDay: string | null = null;
  let group: Extract<ChatItem<M>, { kind: "group" }> | null = null;

  for (const msg of messages) {
    const day = dayKey(msg.timestamp);
    if (day !== currentDay) {
      currentDay = day;
      group = null;
      items.push({
        kind: "day",
        key: `day-${day}`,
        label: formatDayLabel(msg.timestamp, now),
      });
    }

    const last = group?.messages[group.messages.length - 1];
    const continues =
      group !== null &&
      last !== undefined &&
      msg.userId !== undefined &&
      group.userId === msg.userId &&
      msg.timestamp - last.timestamp <= windowMs;

    if (continues && group) {
      group.messages.push(msg);
    } else {
      group = { kind: "group", key: `g-${msg.key}`, userId: msg.userId, messages: [msg] };
      items.push(group);
    }
  }

  return items;
}

/** Splits text into plain parts and @mentions of real players. */
export function splitMentions(
  text: string,
  /** Lowercase usernames the server resolved for this message. Undefined: treat every @word as a mention. */
  knownUsernames: readonly string[] | undefined,
): Array<{ text: string; mention?: string }> {
  const known = knownUsernames ? new Set(knownUsernames) : null;
  return text
    .split(/(@[\w-]+)/g)
    .filter((part) => part !== "")
    .map((part) => {
      if (!part.startsWith("@")) return { text: part };
      const name = part.slice(1);
      if (known && !known.has(name.toLowerCase())) return { text: part };
      return { text: part, mention: name };
    });
}

/** "1 new message", "12 new messages". */
export function newMessagesLabel(count: number): string {
  return count === 1 ? "1 new message" : `${count} new messages`;
}
