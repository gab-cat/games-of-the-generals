# Backend in Games of the Generals: cheap, fast, correct

The goal is the least expensive design that still gives superb quality, and that is
fast. This app went offline in August 2026 because running Convex got too expensive
for Gab to cover (see the README). It now runs on Convex's free plan, so every
design is checked against these team limits (from the dashboard entitlements,
November 2026):

| Metric | Free plan, per month |
|---|---|
| Function calls | 7M |
| Database bandwidth (reads and writes, index entries included) | 7 GB |
| Database storage | 3.5 GB |
| File storage | 7 GB |
| Action compute | 140 GB-hours |

Data at the time of writing (prod, measured with inline queries): `moves` 962k rows
and 282 MB before packing, `games` 10.3k rows and 62 MB, `authRefreshTokens` 55k rows
and 12 MB, `profiles` 10.5k, `users` 11.8k, `conversations` 10.5k (almost all system
notification threads), `achievements` 8.8k, file storage 130 files and 2.6 MB.

When you don't know the pattern that is both cheap and fast, research it before you build.

## Required reading

- [.cursor/rules/convex_rules.mdc](../../../.cursor/rules/convex_rules.mdc): function syntax, validators, `internal*` functions.
- [.cursor/rules/convex-performance.mdc](../../../.cursor/rules/convex-performance.mdc): indexes over filters, pagination.
- Convex docs on limits: one function reads at most about 32k docs and 16 MB, and writes at most about 16k docs.

## Estimate before you build

For anything that runs often, write down: calls per online player per hour, docs and
bytes read per call, and how many live subscriptions each write wakes. Use 200
concurrent players for 10 hours a day (about 60k player-hours a month) as the
baseline. One call per player per minute is 3.6M calls a month, half the budget.

Measure after shipping: `npx convex deployment usage --prod` (day and month totals)
and `npx convex insights --prod`.

## Live data on the client

- Every heartbeat is a function call per player. Global presence is one `usePresence` per tab, mounted once in `Layout` through `GlobalPresenceHeartbeat` at 120s. Never add a second `usePresence` for the same room; before November 2026 the chat and messaging panels each ran one at 60s (about 7M calls a month at 200 players).
- The game room heartbeat (`api.gamePresence` in `src/components/GameBoard.tsx`) is 60s because disconnect forfeits use a 2-minute grace period. Don't shorten it.
- Subscribe only while the thing is on screen: `useOnlineUsers(isOpen)`, `"skip"` until needed (`getMatchResult` is skipped until the game is finished).
- A query re-runs for every subscriber whenever any doc it read changes. `getSpectatableGames` reads every live game, so it returns only list fields, not the 5 KB game row. Hot lists get slim return shapes; if it is still heavy, keep a summary row updated on write.
- `useLobbyPresence` (`src/lib/useLobbyPresence.ts`) is unused. Enabling it as written would add a 10s abandonment check per player; redesign it before use.
- No `Date.now()` or random values in subscribed query args.

## Reads

- Every query path uses `.withIndex(name, q => range)`. `.withIndex("x").filter(field < cutoff)` looks indexed but scans every row past the cutoff when fewer rows match than the `take`. Five crons did this until November 2026.
- Bound every read: `.take(n)`, `.paginate()`, or a tight index range. `.collect()` only on tables that stay small.
- Point lookups for "current game": `findActiveGame` uses `by_player1_status` and `by_player2_status`. Filtering `by_player1` on status read a player's whole history.
- Conversations: use `by_participants`; the system notification thread is `participant1Id === participant2Id === userId` with `isSystemNotification`.
- Don't return whole game rows. `getGame` strips `initialSetupBoard` and `replay`; `getGameReplay` returns `{ _id, _creationTime }` for the game.

## Writes

- Game-ending side effects (`updateProfileStats`, `checkAchievements`, `checkGameSpecificAchievements`, `cleanupSpectatorChat`) are internal mutations called with `ctx.runMutation(internal.…)` and awaited one after another.
- Each move inserts one `moves` row and patches the game. `moves` keeps one index (`by_game_timestamp`); every extra index is another write per move.
- `games.moveCount` and `games.eliminatedPieces` are maintained in `makeMove`; read them instead of counting move rows.

## Game data lifecycle

- Live game: move rows in `moves`, full boards on the game row.
- About an hour after `finishedAt`, the hourly cron `archiveFinishedGames` packs the moves and `initialSetupBoard` into `games.replay` (`convex/lib/replayCodec.ts`, format v1) and deletes the rows. It checks the packed form decodes to the same moves before deleting anything. Games it can't pack are marked with `movesArchivedAt`, keep their rows, and still replay.
- Always read replays with `loadReplay(ctx, game)`; it handles both forms.
- `sweepOrphanMoves` deletes rows whose game is gone or already packed.
- Profiles hold lifetime stats (wins, losses, ELO, streaks, play time), so packed or old games are never needed for stats.
- Expired Convex Auth sessions and refresh tokens are deleted daily by `cleanupExpiredAuth` (sessions last at most 30 days).

## Schema and indexes

- New fields on existing tables are `v.optional`. An index on an optional field can be matched with `.eq("field", undefined)` (used by `by_status_archived`).
- Removing an index is a deploy-time change: first move every reader off it, then drop it.
- `convex dev` pushes on every save to whichever deployment `.env.local` selects. Check it before saving temporary files in `convex/`.

## Data fixes

- Every data change is an internal mutation with `dryRun`, small batches, and self-scheduling until done. Reproduce prod numbers with a read-only inline query first (bundle the pure helper with `bun build` and paste it in).
- Run on a local backend or dev first, compare before and after, then show Gab the plan and the dry-run numbers and get a clear yes before running anything with `--prod`.

## Security

- Public functions: `getAuthUserId` on every one, identity from the session. Admin screens use `verifyAdminAccess`.
- Never leave a public mutation that changes stats, achievements, game state or subscriptions without an auth and ownership check. Until November 2026, `updateProfileStats`, `forfeitGame`, the achievement checks and `extendSubscription` were all public and unauthenticated (anyone could grant themselves Pro+ or pump any player's wins).
- Hidden pieces stay hidden: players get the masked board from `getGame`/`getGameState`. Never send `initialSetupBoard`, `replay` or move rows of a live game to a client.
- Known open items: `presence.heartbeat` trusts the client's `userId` (a username); the PayMongo intent actions in `convex/paymongo.ts` don't check auth.
- Secrets live in Convex env vars: `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`, `PAYMONGO_RETURN_URL`, `SITE_URL`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_CONTACT_EMAIL`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_API_TOKEN`. Names only; never print, log or commit values.
- The PayMongo webhook is `convex/router.ts` and is idempotent through `webhookEvents`.

## Shipping

- Frontend: Vercel builds from `main` (`vercel.json`). `VITE_MAINTENANCE_MODE=true` serves the static offline page without connecting to Convex.
- Backend: prod changes only with `npx convex deploy`, and only when Gab says so.
- Before deploying, run `bun run typecheck`, `bun test tests`, and lint the touched files with `bunx oxlint`. After deploying, watch `npx convex insights --prod` and the usage numbers for a day.
