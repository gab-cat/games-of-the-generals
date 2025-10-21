<!-- 39c5ef2d-9aa7-454c-8339-c57cf648166b 67833947-b1a2-4d82-aa1a-ef4f3c7ea5bf -->
# Fix AI Flag Attack Bug

## Overview

The AI game stops mid-game because the AI attempts to move its Flag to attack non-Flag pieces, which triggers an error in the battle resolution logic. The Flag should only be able to attack another Flag, and should never attack any other piece.

## Root Cause

There are multiple issues in the codebase:

1. **AI Move Generation Filter Too Restrictive** (`convex/aiGame.ts:542`):

   - Current: `if (aiPiece.piece === "Flag" && targetPiece) continue;`
   - This blocks ALL flag attacks, including valid flag-to-flag attacks
   - Should be: `if (aiPiece.piece === "Flag" && targetPiece && targetPiece.piece !== "Flag") continue;`

2. **Missing Player Move Validation** (`convex/aiGame.ts:360-390`):

   - No validation prevents player's flag from attacking non-flag pieces
   - Needs check before resolveBattle is called

3. **Battle Logic Order** (`convex/aiGame.ts:262-319`):

   - Flag logic comes after Spy and Private handlers, causing incorrect battle outcomes
   - Should be evaluated FIRST to prevent conflicts

4. **Missing Safety Check in executeAIMove** (`convex/aiGame.ts:687-700`):

   - No validation before calling resolveBattle
   - Should validate flag attacks as a safety net

## Files to Modify

- `convex/aiGame.ts` - AI game move generation and battle logic

## Implementation Plan

### 1. Fix AI Move Generation Filter (line 542)

Update the filter to allow flag-to-flag attacks while blocking all other flag attacks:

```typescript
// Flag can only attack another Flag
if (aiPiece.piece === "Flag" && targetPiece && targetPiece.piece !== "Flag") continue;
```

### 2. Add Player Move Validation (after line 377)

Before processing the move, validate that flags only attack flags:

```typescript
// Validate flag can only attack another flag
if (fromPiece.piece === "Flag" && toPiece && toPiece.piece !== "Flag") {
  throw new Error("Flag can only capture another Flag");
}
```

### 3. Move Flag Battle Logic to Top (after line 263)

Move the Flag handling block (currently lines 302-309) to immediately after the rank declarations. This ensures Flag logic is evaluated before any other piece-specific handlers.

### 4. Add Safety Check in executeAIMove (after line 692)

Add validation as a safety net:

```typescript
// Validate flag can only attack another flag
if (fromPiece.piece === "Flag" && toPiece && toPiece.piece !== "Flag") {
  throw new Error("Flag can only capture another Flag");
}
```

### 5. Verify Fix

- Test that AI never attempts to attack non-flag pieces with its flag
- Test that flag-to-flag attacks work correctly
- Test that player cannot attack non-flag pieces with their flag
- Ensure game doesn't crash when flag moves are attempted

### To-dos

- [ ] Update AI move generation filter at line 542 to allow flag-to-flag attacks only
- [ ] Add player move validation in makeAIGameMove to prevent invalid flag attacks
- [ ] Move Flag battle logic to top of resolveBattle function
- [ ] Add safety validation in executeAIMove to catch any invalid flag attacks
- [ ] Test AI games to verify flag can only attack flags and game doesn't crash