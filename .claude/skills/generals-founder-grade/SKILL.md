---
name: generals-founder-grade
description: >-
  Games of the Generals edition of Gab's founder-grade standard: finding the real
  reason behind every ask and fixing causes, reading every relevant line, building
  end to end, polished UI under Gab's anti-slop rules and this app's dark board-game
  look, the cheapest fast Convex patterns this repo has learned (it went offline once
  because Convex got too expensive), researching when unsure, and expanding the ask
  when it makes the game better. Use it when you judge a task in this repo would
  benefit (a new feature, a bug, a game or lobby screen, matchmaking, replays,
  chat, presence, payments, a cron, anything that reads games or moves, a redesign),
  or when the user asks for it: founder-grade, enterprise-level, polish this, make it
  the best version, /generals-founder-grade.
  For UI or UX work (a screen, flow, layout, copy on a screen or a redesign), also
  load founder-design.
---

# Founder-grade in Games of the Generals

The same standard as the general `founder-grade` skill (in `~/.claude/skills/` when
it's installed), written so it stands on its own in this repo, plus what this app
has already taught us. In this repo, this file wins where the two differ.
Based on founder-grade (2026-11-17).

Ship work you would put your own name and money behind. Gab trusts you as a thought
partner with real authority. This is Gab's own product: a real-time online Game of
the Generals (Salpakan) with about 10.5k players, ranked quick match with ELO, paid
Pro and Pro+ tiers through PayMongo, and Gab pays the Convex bill himself. The bar
is a product that feels finished: the small details nobody notices until they are
missing.

## UI and UX work: load founder-design too

When the concern is a screen, dialog, flow, layout, empty or error state, on-screen
copy or a redesign, also load the global `founder-design` skill with the Skill tool
(in `~/.claude/skills/founder-design/`) and follow its loop: real Before screenshots,
research, mock-ups of every state on a temporary dev page, a proposal with Before and
After, then the build once Gab picks. This edition stays in charge of how it gets
built; founder-design decides what it should be.

## The five commitments

1. **Find the real reason.** Solve the problem behind the ask, not just the words of it.
2. **Understand before you touch.** Read every line the change depends on.
3. **Build end to end.** Schema, Convex functions, crons, React screens, copy, every state, tests and a real run. Nothing half-wired.
4. **Polish to the last pixel and the last millisecond.** UI per [ui.md](ui.md). Backend per [backend.md](backend.md).
5. **Own the outcome.** Expand the ask when it makes the result better, solve the problems you find on the way, then say what you did.

## 1. Find the real reason

The ask is what Gab noticed. Your job is the reason behind it. This is the higher
level of thinking Gab expects on every task, big or small.

- **Name the goal in one line**: what should be true for players when you're done. The literal request is a clue, not the ceiling.
- **Ask why until you reach the cause.** For a bug: what exactly happens, for whom, since when, what changed, why it happens, and why nothing caught it. For a request: what problem made them ask, who else has it, and what they'll try next. Write the chain down in a line or two before you build.
- **Prove the cause, don't guess it.** Evidence lives in prod, read only: `npx convex run --prod --inline-query '<readonly JS>'` (sandboxed, cannot write), `npx convex data --prod`, `npx convex insights --prod`, `npx convex deployment usage --prod`, and `npx convex logs --prod`. Page through big tables with `.paginate()` in the inline query; one call reads at most about 16 MB. A fix for a guessed cause is a second bug.
- **Fix the cause, then the class.** Patch the root, not the spot where it showed. Then look for the same mistake elsewhere (the five game-ending paths in `convex/games.ts`, the AI game in `convex/aiGame.ts`, spectate, replays, old rows) and fix those too, or list them.
- **Check the fix answers the reason, not just the words.** If doing exactly what was asked wouldn't solve the real problem, say so, solve the real one, and explain the difference.
- **Be proactive, even unprompted.** When you notice something wrong while working (a wrong number, a slow query, a confusing screen, a silent failure, stale data, a risk nobody mentioned), dig into it the same way. Fix it when it's safe and outside the ask-first list below; otherwise report it with the cause and the fix you'd make. Never walk past it.
- **Think one step ahead.** What breaks at 10× today's 10k games and 960k move rows? What will players try next? What will confuse the next person who reads this code? Handle the cheap ones now and name the rest.

This repo's example: "moves use too much storage" was the symptom. The cause was
that finished games kept one row per move forever (962k rows, 282 MB, four indexes
each) while replays only need about 1 KB per game. The fix packs finished games into
`games.replay` and deletes the rows (`convex/gameArchive.ts`), instead of deleting
games, which would have broken Pro's 50 and Pro+'s 100 replays. The same audit found
the real reason the app went offline: two always-mounted presence heartbeats per tab,
which alone would use the whole free function-call budget.

## 2. Understand before you touch

- **Read the rules for the folder first**: [.cursor/rules/convex_rules.mdc](../../../.cursor/rules/convex_rules.mdc) (Convex function syntax and validators), [.cursor/rules/convex-performance.mdc](../../../.cursor/rules/convex-performance.mdc), [.github/instructions/convex.instructions.md](../../../.github/instructions/convex.instructions.md), and [CONTRIBUTING.md](../../../CONTRIBUTING.md).
- **Read the real code paths**: callers, callees, `convex/schema.ts`, `getAuthUserId` checks, `verifyAdminAccess` in `convex/adminDashboard.ts`, and any `ctx.runMutation(internal.…)` chain. Whole functions, not grep hits. Never skim past a line you don't understand.
- **Game rules live in code**: battle resolution and win checks are in `makeMove` in `convex/games.ts`, with the AI copy in `convex/aiGame.ts`. Piece names and ranks are `PIECES` in `convex/games.ts`; `PIECE_CODES` in `convex/lib/replayCodec.ts` must never be reordered because archived replays decode with it. Ask Gab before changing a rule players feel (time limits, ELO, ranks, battle outcomes).
- **Find the existing pattern** before inventing one. Helpers this repo already has: `loadReplay` for any replay read, `findActiveGame` for "is this player in a game", `isSubscriptionActive` in `convex/featureGating.ts`, `useConvexQueryWithOptions` and `useConvexMutationWithQuery` in `src/lib/convex-query-hooks.ts`, the `presence` instance in `convex/presence.ts`, `GlobalPresenceHeartbeat` in `src/lib/useOnlineUsers.tsx`. A second way of doing the same thing is a cost.
- **Map the blast radius**: a game ends in five places (`makeMove`, `surrenderGame`, `timeoutGame`, `forfeitGame`, `handleDisconnectionForfeit`, plus `checkOpponentTimeout` and `handleSetupTimeout`), and each updates profiles, ELO, achievements, lobby, presence and spectator chat. Change one and check them all. Games are read by the game board, spectate list, spectator view, match history, replays, the lobby's current-game check, the admin dashboard and the daily presence cron.
- **Research when unsure**: Convex docs (limits, indexes, pagination, scheduling), the component sources in `node_modules/@convex-dev/*/src`, and current reputable write-ups. Say in your report what you learned and why you chose it.

## 3. Build end to end

A change is done when a real player can use it start to finish and recover from every failure:

- **Data**: every new query path gets an index in `convex/schema.ts`. Fields on existing tables are added as `v.optional` first; existing rows must keep working. Table data changes run as batched, resumable internal mutations with a `dryRun` flag (see `archiveFinishedGames`).
- **Server**: every public `query` and `mutation` checks `getAuthUserId` (or `verifyAdminAccess`) and derives identity from it, never from an argument. Anything that only other functions call is `internalMutation` / `internalQuery` and is called through `internal.*`, never `api.*`. Await every promise in a mutation; a `void` promise can be dropped when the transaction commits.
- **Client**: every state in [ui.md](ui.md), optimistic updates where safe, Undo for destructive actions.
- **Copy**: plain words. Players never see stack traces or raw Convex errors.
- **Wiring**: routes are TanStack Router files in `src/routes/` (regenerates `src/routeTree.gen.ts`), pages live in `src/pages/<area>/`, nav is in `src/components/Layout.tsx`. Check the phone layout; most players are on phones.
- **Docs**: update `README.md`, `CHANGELOG.md` and the cursor rules when a convention changes.
- **Proof**: `bun test tests` for logic (bun's built-in runner; tests live in `tests/`), `bun run typecheck`, `bunx oxlint <files>`, and a real run (see below).

## 4. Own the outcome

- **You have authority to go past the ask.** Fix the adjacent bug, add the missing empty state, make the obvious next step one click, speed up the slow query you walked past, tighten the copy on the screen you touched. Anything that touches cost, check against the free plan in [backend.md](backend.md).
- **Expand toward the goal, not sideways.** Extras make the asked-for thing better or complete. A new, unrelated feature is a proposal in your report, not a surprise in the diff. Problems are different: problems you find get solved (or reported with their cause); features you think of get proposed.
- **Always say what you added** beyond the ask and why, as a short list.
- **Ask first only when the call is really Gab's**: anything that writes or deletes prod data (`--prod` mutations, backfills, imports), `npx convex deploy`, pushing to `main` (Vercel deploys the site from it), turning maintenance mode off (`VITE_MAINTENANCE_MODE`), pricing, tiers and replay limits (`replayLimits` in `getMatchHistory`, `src/lib/pricing-tiers.ts`), anything PayMongo, messages or emails to players, bans, and game rules players feel. Ask one clear question with your recommendation, and keep working on everything that doesn't depend on the answer.

## Client ledger

This is Gab's own product; there is no client and no ledger entry for it. If that
changes (a sponsor, a partner studio), create one with
`python3 -I ~/.claude/skills/founder-grade/scripts/client_ledger.py new-client` and
add this section back. Gab's own decisions go to memory.

## Running it for real

- **Convex accounts**: this folder is selected for the `personal` Convex account (`npx convex account list`); Gab's default account is `work`. Use `npx convex@latest` for login and account commands.
- **Deployments**: project `gg-2` in team `gab-cat`. Dev is `adjoining-stingray-318`, prod is `brave-civet-29`. `.env.local` selects dev.
- **Local backend for tests that write**: `npx convex dev --configure existing --team gab-cat --project gg-2 --dev-deployment local` with Node 22 or 24 on `PATH` (the default Node 26 can't run the `"use node"` actions), then set placeholder values for `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`, `PAYMONGO_RETURN_URL` and `SITE_URL` with `npx convex env set`, because `convex/paymongo.ts` requires them at load. This rewrites `.env.local`; switch back with `npx convex deployment select gab-cat:gg-2:dev/gab-cat`.
- **Shared working tree**: Gab often runs more than one session here. Check `git status` before you start and before any push to dev, and never deploy someone else's half-finished files.
- **App**: `bun run dev` runs Vite and `convex dev` together.

## Done gate

Check every line before you say done:

- [ ] You found and proved the real cause or need, fixed it at the root, and checked for the same problem elsewhere.
- [ ] The goal works for a real player start to finish, including first use and failure paths.
- [ ] Every UI state from [ui.md](ui.md) is handled, and the house look and rules hold.
- [ ] Every control has hover, press, focus and disabled states; every async action shows pending, then success or error.
- [ ] Backend reads are indexed and bounded, no N+1, no needless live subscriptions or heartbeats, and cost is estimated against the free plan (7M calls, 7 GB bandwidth a month).
- [ ] Every public function checks auth on the server; anything internal is `internal*`; input is validated; secrets stay on the server.
- [ ] Existing data still works (old games without `initialSetupBoard`, unpacked games), and any data change is reversible or dry-run first.
- [ ] `bun run typecheck`, `bunx oxlint` on touched files and `bun test tests` are clean.
- [ ] You ran it for real: a local backend or dev for backend changes, the browser for UI.
- [ ] For any UI change, Before and After screenshots are attached to the report (same route, same data, desktop and a 390px phone width).
- [ ] README, CHANGELOG and the cursor rules are updated if a convention changed.
- [ ] You re-read your diff line by line as a strict reviewer and removed debug code (`console.log` in render paths), dead code and stray edits.

## Report

Lead with what the user can do now. For a UI change, show the Before and After screenshots next. Then the real cause you found and the evidence, in a line or two. Then list what you added beyond the ask, other problems you found and what you did about each, what you verified and how, what you chose not to do and why, and any open question. Plain words, no hype. If something failed or wasn't verified, say so.
