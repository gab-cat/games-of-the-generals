<!-- 4254b512-01ea-4488-ab87-c3bb9b78a5b6 9fc093b2-d646-4c14-8868-6dbc3182ad93 -->
# Game Mode Selection Implementation

## Overview

Add game mode selection when creating a lobby with three modes:

- **Classic**: Standard game rules with 15 minutes per player
- **Blitz**: Fast-paced with 6 minutes per player
- **Reveal Mode**: Winner's piece rank is revealed after each attack

## 1. Database Schema Changes

Update `convex/schema.ts` to add `gameMode` field to lobbies and games tables:

**Lobbies table** - Add:

```typescript
gameMode: v.optional(v.union(
  v.literal("classic"),
  v.literal("blitz"),
  v.literal("reveal")
))
```

**Games table** - Add:

```typescript
gameMode: v.union(
  v.literal("classic"),
  v.literal("blitz"),
  v.literal("reveal")
)
```

## 2. Backend Convex Changes

### Update `convex/lobbies.ts`:

- Modify `createLobby` mutation to accept `gameMode` parameter (default to "classic")
- Store game mode in lobby document

### Update `convex/games.ts`:

- Modify `startGame` mutation to copy `gameMode` from lobby to game
- Update timer constants based on game mode:
  - Classic: 15 minutes (900000 ms)
  - Blitz: 6 minutes (360000 ms)
  - Reveal Mode: 15 minutes (900000 ms)
- Modify `makeMove` mutation to handle reveal logic:
  - In Classic/Blitz: Only reveal pieces in ties
  - In Reveal Mode: Winner's piece is revealed after each challenge

## 3. Frontend Lobby Creation UI

Update `src/pages/lobby/` components to add game mode selection:

### Create new component `GameModeSelector.tsx`:

- Radio buttons or card-based selection for three modes
- Display mode name, description, and icon/badge
- Descriptions:
  - Classic: "Standard rules with 15 minutes per player"
  - Blitz: "Fast-paced action with 6 minutes per player"
  - Reveal Mode: "Winner's rank is revealed after each attack"

### Update lobby creation form:

- Add game mode selector to create lobby dialog/form
- Pass selected mode to `createLobby` mutation
- Default to "classic" mode

## 4. Game Logic Updates

### Update timer logic in game components:

- Read `gameMode` from game document
- Adjust `TIME_LIMIT_MS` constant based on mode:
  - Classic/Reveal: `15 * 60 * 1000`
  - Blitz: `6 * 60 * 1000`
- Update timer display to show appropriate total time

### Update challenge result logic in `convex/games.ts`:

- In `makeMove` mutation's challenge handling:
  - Classic/Blitz: Keep existing reveal logic (only ties reveal both)
  - Reveal Mode: Set `revealed: true` for winner's piece after challenge

## 5. UI Display Updates

### Lobby list display:

- Add game mode badge/indicator to each lobby card
- Use distinct colors or icons:
  - Classic: Blue badge or standard icon
  - Blitz: Red/orange badge with lightning icon
  - Reveal Mode: Purple badge with eye icon

### Game screen display:

- Show current game mode in game header/info section
- Display mode-specific timer warnings (more urgent for Blitz)
- Update game board to reflect reveal mode behavior

## 6. Testing Considerations

- Test lobby creation with each mode
- Verify timer limits are correct for each mode
- Test reveal logic in Reveal Mode (winner's piece shows rank)
- Ensure Classic and Blitz maintain standard reveal behavior
- Test mode persistence through game lifecycle
- Verify replay system shows correct mode behavior

### To-dos

- [ ] Add gameMode field to lobbies and games tables in schema.ts
- [ ] Update createLobby mutation to accept and store gameMode parameter
- [ ] Update startGame mutation to copy gameMode from lobby to game
- [ ] Update timer logic in makeMove and timeout functions to use mode-specific time limits
- [ ] Implement Reveal Mode logic in makeMove to reveal winner's piece rank after challenges
- [ ] Create GameModeSelector component with radio buttons/cards for three modes
- [ ] Integrate GameModeSelector into lobby creation form and pass mode to mutation
- [ ] Add game mode badges/indicators to lobby list display
- [ ] Update game screen to show current mode and reflect mode-specific behavior
- [ ] Test each game mode end-to-end: creation, gameplay, timers, and reveal logic