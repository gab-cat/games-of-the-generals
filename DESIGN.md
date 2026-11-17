# Design: Season 3

The look for Games of the Generals from Season 3 on. Same game, same dark
military board-game feel, with the noise taken out. The Season 3 welcome dialog
(`src/components/modals/SeasonUpdateModal.tsx`) is the reference: near-black,
warm off-white text, one gold accent, a serif headline, thin dividers.

## Principles

1. **The board and the players are the decoration.** No fake HUDs, scanlines,
   floating particles, "system status" chips or invented stats.
2. **Plain words with a light touch of the game's world.** Real game nouns are
   fine (General, ranks, battle, flag, lobby, spectate). Fake tech jargon is
   not (system, protocol, operative, telemetry, database, node, module, intel,
   uplink, clearance, "initiate", "terminate", underscores like `SYSTEM_ONLINE`).
3. **One accent.** Gold is the only brand colour. Green and red mean win and
   loss (or success and danger). Blue, purple, pink and gradients are gone.
4. **Flat surfaces.** 1px borders and slight tints separate things. No card
   shadows, no glass blur, no glows.
5. **Sentence case everywhere.** No `uppercase`, no letter-spaced labels, no
   eyebrows above headings.

## Tokens

Defined in `src/index.css` (and the critical subset in `index.html`), exposed in
`tailwind.config.js`.

| Use | Class |
|---|---|
| Page background | `bg-background` (#0b0b0d) |
| Card / panel | `bg-card` (#111114) + `border border-border`, or the `surface` utility |
| Hover / nested surface | `bg-white/[0.04]`–`bg-white/[0.08]`, or `bg-raised` |
| Border | `border-border`; stronger: `border-border-strong` |
| Text | `text-foreground`. Secondary lines `text-foreground/80`. `text-muted-foreground` only for timestamps, placeholders, disabled |
| Accent (one main action, active nav, highlights) | `bg-primary text-primary-foreground`, `text-gold-400`, tints `bg-gold-500/10 border-gold-500/30` |
| Win / success | `text-emerald-400`, tint `bg-emerald-500/10` |
| Loss / danger | `text-red-400`, tint `bg-red-500/10` |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-ring/70` (gold) |

Replace on sight: `amber-*` → `gold-*` (or `primary`), `blue-*`/`purple-*`/`pink-*`/`indigo-*`/`cyan-*` accents → gold or neutral, `zinc-900/950` panels → `bg-card`, `bg-black/20 backdrop-blur-*` → `bg-card`.

## Type

One typeface: **Poppins** (400, 500, 600, 700), loaded in `index.html`. `font-sans`, `font-body`, `font-display` and `font-mono` all resolve to it.

- **Page titles**: `font-display font-semibold`, sentence case, `text-3xl sm:text-4xl`. Headings get a slight negative letter-spacing in `index.css`. Use `PageHeader`.
- **Section titles**: `text-base sm:text-lg font-semibold`. Use `SectionHeader`.
- **Body**: `text-sm`/`text-base`.
- **Labels**: `text-xs`/`text-[13px]`, sentence case, `text-foreground/70`–`/80`. Never uppercase.
- **Numbers**: Poppins digits are proportional and the font has no tabular figures. Static numbers (ELO, counts) are fine as is. Anything that ticks (game clocks, countdowns) must keep each digit in a fixed-width slot so it doesn't wobble.

## Shape and spacing

- Cards and panels: `rounded-lg` (8px). Buttons, inputs, tabs: `rounded-md` (6px). Badges: `rounded` (4px). Avatars and status dots stay round. Nothing else is a pill.
- No `shadow-*` on cards. Popovers, menus and toasts may use one soft shadow.
- Page column: `max-w-7xl`, padding `px-4 sm:px-6`. Content sections `space-y-6 sm:space-y-8`.
- Phone first: check 390px. Tap targets at least 40px (`h-10`). No sideways scroll.

## Components

All in `src/components/ui/`.

- `Button`: `default` is gold, for the one main action in a view. `secondary` for everything else visible, `ghost` for toolbar and icon buttons, `destructive` for danger, `link` for inline links. Sizes `default` (h-10), `sm` (h-9), `lg` (h-11), `icon` (h-10 w-10).
- `Card` / `CardHeader` / `CardTitle` / `CardContent`: flat 8px panel.
- `Badge`: `default` (gold tint), `secondary`, `outline`, `success`, `destructive`.
- `Tabs`: segmented control, sentence case.
- `PageHeader` (`page-header.tsx`): title, optional one-line description, optional actions. Every top-level page starts with it.
- `SectionHeader` (`page-header.tsx`): heading inside a page.
- `EmptyState` (`empty-state.tsx`): title, one line, the one action that fills it. No icon tile.
- `Skeleton` (`skeleton.tsx`): for dynamic data only, shaped like the real row.
- `Stat` (`stat.tsx`): sentence-case label over a mono number, tones `default`, `gold`, `win`, `loss`.
- Dialogs: `Dialog`/`AlertDialog` are flat 8px cards with a Playfair title and a 36px close button.

## Season key art

`ChevronClash` and `SeasonSticker` (`src/components/season/ChevronClash.tsx`) are the Season 3 key art: the blue and red chevrons from the 1981 box charge in and meet, with the Season 3 painting inside them as a two-colour print. Use them for season moments only (the sign-in page, the season announcement), so they stay special. Blue and red here are the two armies, the same player colours as the board.

## Signature pages

Most screens stay quiet. Eight get one loud moment at the top, built from the season art, so the app feels like a game and not a settings page. Gab asked for this on 2026-11-17 ("some pages just need to be awesome").

| Page | The moment |
|---|---|
| Lobby (`src/pages/lobby/fight-card.tsx`) | Quick match as a title card: you on the blue half, the opponent slot on the red. Lobbies are bouts with a dashed "Your seat" corner as Join. |
| Vs AI | Three tall portraits; the picked one widens. |
| Game result (`src/components/season/ResultTitleCard.tsx`) | The winner's colour charges across, "Victory"/"Defeat"/"Draw" huge, a sticker with how it ended. Online and AI modals share it. |
| Leaderboard | Podium for the top three, then players grouped under their rank insignia, and a pinned "You" bar. |
| Profile | Avatar in a blue chevron, name at poster size, the road through all seven ranks. |
| News | Front page: "News" nameplate, lead story with art, older posts in ruled columns. |
| Achievements | Ribbons on a rack; locked ones show their stripes at 40% and fill with progress. |
| Pricing | Three painted posters (private, captain, general) with the price at poster size; a 1/3/6/12-month picker rolls every price. Donate is a wide band on the supply-line painting. |

The pieces live in `src/components/season/art.tsx`:

- `Painting` (full colour, faded toward one edge for type) and `Duotone` (grayscale with an army colour multiplied over, like the key art). Pick the crop from `CROPS`; each page has its own painting in `/public/art` so the same picture isn't everywhere. They were generated with the Antigravity CLI from the Season 3 painting, about 1 MB in total.
- `Insignia`: the player ranks drawn from Philippine Army insignia. Chevrons for Private and Sergeant, triangles for Lieutenant and Captain, suns for Major and Colonel, stars for General. These stars are rank insignia, not decoration; never use them to mean "special". `toPlayerRank`, `rankFor` and `nextRank` follow the server's thresholds (`convex/profiles.ts`: 3, 5, 10, 20, 30, 50 wins).
- `CHEVRON` clip paths, `Grain`, `Sticker` (one tilted label per page at most).

The support prompt (`UpgradeDonationCTA`) is an alert dialog on the same supply-line painting, at most once a day, only for free players who have finished a game, and never on top of another dialog. Prices on screen come from `convex/lib/planPricing.ts`, the same quote the server charges.

The lobby also opens with the tournament invite (`src/pages/lobby/TournamentInvite.tsx`): a gold band in the sticker style, dark ink on gold, with a knockout bracket drawn in. Gab asked for it at the top and attention-grabbing (2026-11-17). It hides for 30 days when dismissed or after a ticket is sent, and stays compact on phones so Quick match is still above the fold.

Rules for these pages: one signature moment per page, then the normal quiet layout. The main action stays the most obvious thing. Type on a painting sits on its faded edge. Big names truncate. Everything still works at 390px.

## Loader

Two loaders, picked by Gab on 2026-11-17 (rejected: a row of face-down pieces flipping to show their ranks).

- **App start: the title card.** `#boot` in `index.html`, outside `#root`: the blue and red chevrons charge in from the screen edges with the 1981-box halftone, meet with a gold flash and keep pushing, with "Games of the Generals" and the Season 3 sticker under them. Pure CSS plus inline SVG, and the words are Poppins outlines, so it paints before any script or web font. React renders underneath it; `src/lib/boot-screen.ts` fades it out once nothing holds it. Every `LoadingSpinner` that mounts while the app is starting, and every `fullScreen` one, holds the title card instead of drawing its own, so a player sees one loader from the first paint to the first real page.
- **Inside a page: the board.** `DeployBoard` in `LoadingSpinner.tsx`: the real 9×8 board, both armies set up their 21 pieces back row first, the front line lights gold, the board clears (3 s). Sizes `sm`, `md`, `lg`.
- Reduced motion shows both still: the chevrons met, the board full.
- To change the words on the title card, regenerate the outlines from Poppins (opentype.js, Bold for "Generals" and "Season 3", SemiBold for "Games of the").

Nothing in `<head>` may block the first paint, or the loader shows late (it took 1.1 s on a slow phone when Google Fonts and the app stylesheet blocked it; 0.3 s now). Google Fonts loads with `rel=preload` + `onload`, the app stylesheet is switched on when it loads (`nonBlockingAppCss` in `vite.config.ts`), and `main.tsx` waits for it before rendering React. The loader's first frame must already show the mark, never a fade in from nothing.

## Icons

Lucide, inline at `size-4`, next to text in nav, buttons and list rows. Never
put an icon on a tinted square or circle ("icon tile"). Never use sparkles,
stars or wands to mean "special". Ranks and pieces use `getPieceDisplay`
(`src/lib/piece-display.tsx`).

## Motion

- `MotionConfig reducedMotion="user"` is set at the root, and `src/index.css`
  shortens CSS animations for `prefers-reduced-motion`.
- Presets in `src/lib/motion.ts`: `riseIn` for one element, `stagger()` +
  `fadeUp` for lists and grids. 200–300ms, ease-out, 6px rise. No springs that
  overshoot, no infinite decorative loops (pulsing dots only for "live").
- Every control has hover, active (`active:scale-[0.98]` comes with `Button`),
  focus-visible and disabled states. Async actions show pending in place.

## Copy

- Say what it is and what happens next. "Leaderboard", "Match history",
  "Settings", "Create lobby", "Join with code", "Sign out".
- No taglines, no hype, no triplets, no em-dash flourishes.
- Errors in plain words with a way out. Never show a raw Convex error.
- Plurals right: "1 game", "12 games".

## Page checklist

- [ ] Starts with `PageHeader`, no eyebrow, sentence case.
- [ ] No `uppercase`, no `tracking-wider`/`tracking-widest`, no mono words.
- [ ] Only gold as accent; green/red only for win/loss or success/danger.
- [ ] Cards `rounded-lg`, no shadows, no blur, no icon tiles.
- [ ] Empty, loading (skeleton), error and long-content states look right.
- [ ] Works at 390px with no sideways scroll; tap targets ≥ 40px.
- [ ] Entrance motion is short; lists stagger.
