/**
 * Turn a Convex error into a sentence a player can act on. Convex wraps the
 * message in request ids and stack text; none of that should reach the screen.
 */
const KNOWN: Array<[RegExp, string]> = [
  [/Not authenticated/i, "You are signed out. Sign in again and retry."],
  [/Lobby is full/i, "That lobby is already full."],
  [/Lobby is not available/i, "That lobby is no longer open."],
  [/Lobby not found|Invalid lobby code/i, "No open lobby matches that code."],
  [/Cannot join your own lobby/i, "You can't join your own lobby."],
  [
    /already have an active (lobby|game)/i,
    "You are already in a lobby or game.",
  ],
  [
    /Game not found|Associated lobby not found/i,
    "That game could not be found.",
  ],
  [/Cannot spectate finished games/i, "That game has already ended."],
  [
    /already a player in this game|Cannot spectate a game you are playing/i,
    "You are playing in that game.",
  ],
  [
    /Spectators are not allowed/i,
    "The host turned spectators off for that game.",
  ],
  [/Maximum number of spectators/i, "That game has no spectator seats left."],
];

export function friendlyError(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  for (const [pattern, text] of KNOWN) {
    if (pattern.test(raw)) return text;
  }
  return fallback;
}
