<!-- 753061b9-75e5-4c29-b9f0-eb2bc29ef427 b151487a-13b2-40f5-bf3e-eb3b3820bac0 -->
# Fix Flag Capturing Bug

## Problem Summary

The Flag piece is incorrectly able to attack and eliminate (or tie with) other pieces. According to official Game of the Generals rules:

- The Flag can ONLY capture another Flag
- When the Flag attacks any other piece, it should LOSE (be captured)
- The current code allows Flag attacks to result in ties or wins against various pieces

## Root Cause

In both `convex/games.ts` and `convex/aiGame.ts`, the Flag battle logic is evaluated AFTER other piece-specific handlers in the if-else chain. This causes incorrect outcomes:

1. **In games.ts (lines 392-402)**: When Flag attacks Sergeant (or any officer), the Sergeant handler catches it first and returns "tie" instead of letting Flag-specific logic handle it
2. **In games.ts (line 359)**: When Flag attacks Spy, returns "tie" instead of error
3. **In games.ts (line 379)**: When Flag attacks Private, Flag wins instead of throwing error
4. **In aiGame.ts (line 285)**: When Flag attacks Spy, returns "tie" instead of error
5. **In aiGame.ts (line 300)**: When Flag attacks Private, Flag wins instead of throwing error

## Files to Modify

1. `convex/games.ts` - multiplayer game battle logic (lines 336-421)
2. `convex/aiGame.ts` - AI game battle logic (lines 262-319)

## Solution

Move Flag battle logic to the TOP of the if-else chain (immediately after the winner variable declaration) in both files. This ensures Flag-specific rules are evaluated first before any other piece handlers can incorrectly process Flag attacks.

The Flag logic should:

- Allow Flag vs Flag (attacker wins)
- Throw error when Flag attacks any other piece (preventing the move)
- Allow any piece to capture Flag (defender loses)

## Implementation Steps

1. In `convex/games.ts`:

- Move the Flag handling block (currently lines 403-411) to immediately after line 337
- This places it before all other piece-specific handlers

2. In `convex/aiGame.ts`:

- Move the Flag handling block (currently lines 302-309) to immediately after line 264
- This places it before Spy and Private handlers

3. Test the fix by verifying:

- Flag cannot attack any piece except another Flag
- Any piece can capture a Flag
- Flag vs Flag battle results in attacker victory

### To-dos

- [ ] Move Flag handling logic to top of battle resolution in convex/games.ts
- [ ] Move Flag handling logic to top of battle resolution in convex/aiGame.ts
- [ ] Verify the fix follows official Game of the Generals rules