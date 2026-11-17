# UI in Games of the Generals

## Gab's rules (never traded away)

- Sentence case. No all-caps labels, no letter-spaced uppercase.
- No eyebrows above headings. Lead with the heading.
- Cards are slightly rounded (6–8px), never pill-shaped. No shadows on cards; separate with a 1px border or a background tint.
- No AI glyphs (sparkles, stars, wands, ✨, ✳). Icons name the actual thing, or no icon.
- No icon tiles (an icon on a small tinted or filled square). Show something real: avatars, a count, a piece, or just the heading.
- Text is `text-foreground` (here usually `text-white` or `text-white/90` on the dark surfaces). Muted grey only where it carries meaning: timestamps, placeholders, disabled.
- Copy follows the anti-slop approach: no filler, plain specific words, no hype, no em-dash flourishes.
- Every interaction gives feedback: hover, press, focus, a pending state for every async action, then success or error.
- Content enters with a short animation; lists and grids stagger. Respect `prefers-reduced-motion`.
- Skeletons only for dynamic data, mirroring the real layout. Static parts render as real content immediately.

## House look: Season 3 (`DESIGN.md`)

- The spec is `DESIGN.md` at the repo root. Read it before any UI work. The Season 3 welcome dialog (`src/components/modals/SeasonUpdateModal.tsx`) is the visual reference.
- Near-black `bg-background`, flat `bg-card` panels with `border-border`, warm off-white text, one gold accent (`primary`, `gold-*`). Green and red only for win/loss or success/danger. Player 1 blue and player 2 red on the board are game colours, not accents.
- Font: Poppins for everything (`tailwind.config.js`, `index.html`). Its digits are proportional, so ticking clocks need fixed-width digit slots.
- Tokens live in `src/index.css` (critical subset in `index.html`). Primitives in `src/components/ui/` are already restyled; page building blocks are `PageHeader`/`SectionHeader`, `EmptyState`, `Skeleton` and `Stat` there, motion presets in `src/lib/motion.ts`.
- `MotionConfig reducedMotion="user"` is at the root and `index.css` shortens CSS animations for reduced motion.
- Pages render inside `Layout`'s `max-w-7xl px-4 sm:px-6` column. Don't add another page-level `px-*`/`py-*` wrapper; narrow reading pages may use `mx-auto max-w-3xl`. The one exception is the signed-out home page: Layout drops the column there so the sign-in split runs edge to edge.
- Season moments (sign-in page, season announcement) use `ChevronClash` + `SeasonSticker` from `src/components/season/`. Gab picked this "title card" look over a 3D war table and a planning map; plain heroes read as "too bland" to him.
- Signature pages (lobby, vs AI, game result, leaderboard, profile, news, achievements) each get one loud moment from `src/components/season/art.tsx` (`Painting`, `Duotone`, `Insignia`, chevrons); see "Signature pages" in DESIGN.md. New paintings: generate them in the Season 3 oil style with the Antigravity CLI (`agy -p "...use your image generation tool... style reference: <file>" --dangerously-skip-permissions`), convert to webp around 100 KB, add a crop to `CROPS`. Don't reuse one painting across pages.
- Rule accuracy in any demo or copy: in Classic and Blitz the arbiter removes the loser and shows neither rank; only ties show both (`convex/games.ts`). Don't flip enemy pieces face up like Stratego.
- Piece names and icons come from `getPieceDisplay` in `src/lib/piece-display.tsx`. Use it so every screen shows pieces the same way.

## Motion pieces to reuse

- Centre an animated framer-motion element with framer's own `style={{ x: "-50%" }}`, not Tailwind's `-translate-x-1/2`: any animated transform (`y`, `scale`) replaces the class, which pushed the lobby's "vs" about 28px off the middle.
- framer-motion is used across the app; `riseIn` / `stagger()` + `fadeUp` from `src/lib/motion.ts` for entrances, `ExpandableCard` in `src/components/ExpandableCard.tsx` for expand and collapse.
- `useAutoAnimate` in `src/lib/useAutoAnimate.ts` for list insert and remove animations.
- Toasts are sonner, mounted in `src/routes/__root.tsx`.

## Every state of every dynamic surface

| State | What good looks like |
|---|---|
| First load | Skeleton mirroring the real layout (board grid, lobby cards, leaderboard rows); static chrome is real content. |
| Loaded | Rises in; lists stagger. |
| Empty | Says what goes here and offers the one action that fills it ("No open lobbies. Create one"). |
| Filtered to nothing | Names the active filters and offers to clear them. |
| Error | Plain words and Retry. Raw Convex errors ("Not authenticated", "Game not found") are mapped to player language. |
| Refetching | Old content stays; small indicator, never a blank flash. |
| No permission | Hidden if it can't be used; Pro features say which tier unlocks them (`src/lib/pricing-tiers.ts`). |
| Long content | Usernames and lobby names truncate with the full text on hover. |
| Many items | Paginate (match history, leaderboard, chat history); scroll position survives navigation. |
| One vs many | Correct plurals ("1 move", "12 moves", "1 spectator"). |

## Game-specific details

- The opponent's hidden pieces never reach the client. Don't build a UI that needs them during play.
- Timers use `font-mono tabular-nums` and must not jump when a digit changes width.
- Moves, battles and game end have sound (`useSound` in `src/lib/SoundProvider.tsx`); new game events get one too, and respect the sound settings.
- The board must work at 360px wide with touch: hit targets at least 40px, no hover-only affordances.
- Spectators see both sides; players see only their own. Check both views when you change the board.

## Interaction details

- Real links for navigation (TanStack Router `Link`) so Cmd-click opens a new tab.
- Keyboard: tab order, Enter submits, Esc closes dialogs and the chat sheet.
- Live feeds (global chat, and any future lobby or spectator chat): group a sender's messages within 5 minutes under one avatar, name and clock time (`groupChatMessages` in `src/lib/chat-grouping.ts`), day dividers, follow new messages only when the reader is within 150px of the bottom, otherwise a "N new messages" button. Your own sends always scroll down.
- Players without a picture get `defaultAvatarFor(username)` from `UserAvatar`, so a list of players never shows identical faces.
- Server-resolved names, not client lookups: never load every profile to check a name on the client. Return what the row needs from its query (chat returns `mentionedUsernames`).
- Async buttons show pending in place with stable width and block double submits (moves, setup, surrender, join lobby, payments).
- Optimistic updates where the server will almost surely agree, with rollback and a toast when it doesn't.
- Destructive actions prefer Undo; surrender and leaving a live game need a clear confirm that says what is lost (the game counts as a loss).
- URL holds the state worth sharing: lobby tab, the game id, replay id, profile username.
- Times show relative ("5 minutes ago") with the exact time on hover; most players are in the Philippines (crons are scheduled with PH time in mind).

## Verify

- `bun run dev` runs Vite (opens the browser) and `convex dev` together. Sign in with a guest (anonymous auth) or a test account on dev.
- A game needs two players: use a second browser profile or a private window for the second account.
- `VITE_MAINTENANCE_MODE=true` in `.env` shows the offline page instead of the app; check it is not set when testing.
- Look at it at real data size, on a 390px phone width, empty and overfull, before calling it done.
- Screenshot the screen before you edit and again after, same page, data and viewport, and attach both to the report as Before and After.
