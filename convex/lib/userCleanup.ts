import { MutationCtx, QueryCtx } from "../_generated/server";
import { Id, TableNames } from "../_generated/dataModel";

// Per-user cap for each table. Guests never have more than a handful of rows.
const PER_TABLE = 100;

// True when the account can still sign in: it has a session that hasn't expired.
export async function hasLiveSession(ctx: QueryCtx, userId: Id<"users">) {
  const now = Date.now();
  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .take(PER_TABLE);
  return sessions.some((s) => s.expirationTime > now);
}

// True when a guest has since attached a real login (password, Google, GitHub).
// Such accounts are real players even if `isAnonymous` was never cleared.
export async function hasRealLogin(ctx: QueryCtx, userId: Id<"users">) {
  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .take(PER_TABLE);
  return accounts.some((a) => a.provider !== "anonymous");
}

// A guest is safe to delete once it can't sign in again and isn't playing.
export async function isDeletableGuest(ctx: QueryCtx, userId: Id<"users">) {
  return (
    !(await hasLiveSession(ctx, userId)) &&
    !(await hasRealLogin(ctx, userId)) &&
    !(await isInLiveGame(ctx, userId))
  );
}

export async function isInLiveGame(ctx: QueryCtx, userId: Id<"users">) {
  for (const status of ["setup", "playing"] as const) {
    const asP1 = await ctx.db
      .query("games")
      .withIndex("by_player1_status", (q) => q.eq("player1Id", userId).eq("status", status))
      .first();
    if (asP1) return true;
    const asP2 = await ctx.db
      .query("games")
      .withIndex("by_player2_status", (q) => q.eq("player2Id", userId).eq("status", status))
      .first();
    if (asP2) return true;
  }
  return false;
}

// Deletes an account and everything that only belongs to it, including its auth
// rows. Games, chat history and moderation records stay: they belong to other
// players too and carry the username, not a live reference. Returns rows deleted.
export async function deleteUserAndData(ctx: MutationCtx, userId: Id<"users">) {
  let deleted = 0;
  const del = async (id: Id<TableNames>) => {
    await ctx.db.delete(id);
    deleted++;
  };

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (profile) {
    if (profile.avatarStorageId) {
      try {
        await ctx.storage.delete(profile.avatarStorageId);
      } catch {
        // Already gone; nothing to free.
      }
    }
    await del(profile._id);
  }

  const owned = await Promise.all([
    ctx.db.query("setupPresets").withIndex("by_user", (q) => q.eq("userId", userId)).take(PER_TABLE),
    ctx.db.query("achievements").withIndex("by_user", (q) => q.eq("userId", userId)).take(PER_TABLE),
    ctx.db.query("pushSubscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).take(PER_TABLE),
    ctx.db.query("emailChangeVerifications").withIndex("by_user", (q) => q.eq("userId", userId)).take(PER_TABLE),
    ctx.db.query("aiGameSessions").withIndex("by_player", (q) => q.eq("playerId", userId)).take(PER_TABLE),
    ctx.db.query("userChatSettings").withIndex("by_user", (q) => q.eq("userId", userId)).take(PER_TABLE),
    ctx.db.query("matchmakingQueue").withIndex("by_user", (q) => q.eq("userId", userId)).take(PER_TABLE),
    ctx.db.query("chatMentions").withIndex("by_mentioned_user", (q) => q.eq("mentionedUserId", userId)).take(PER_TABLE),
    ctx.db.query("seasonRecords").withIndex("by_user_season", (q) => q.eq("userId", userId)).take(PER_TABLE),
  ]);
  for (const rows of owned) for (const row of rows) await del(row._id);

  const conversations = [
    ...(await ctx.db.query("conversations").withIndex("by_participant1", (q) => q.eq("participant1Id", userId)).take(PER_TABLE)),
    ...(await ctx.db.query("conversations").withIndex("by_participant2", (q) => q.eq("participant2Id", userId)).take(PER_TABLE)),
  ];
  const seen = new Set<string>();
  for (const conversation of conversations) {
    if (seen.has(conversation._id)) continue; // system conversations list the user twice
    seen.add(conversation._id);
    const other =
      conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id;
    const messages = [
      ...(await ctx.db
        .query("messages")
        .withIndex("by_conversation_timestamp", (q) => q.eq("senderId", userId).eq("recipientId", other))
        .take(500)),
      ...(other === userId
        ? []
        : await ctx.db
            .query("messages")
            .withIndex("by_conversation_timestamp", (q) => q.eq("senderId", other).eq("recipientId", userId))
            .take(500)),
    ];
    for (const message of messages) await del(message._id);
    await del(conversation._id);
  }

  const lobbies = await ctx.db
    .query("lobbies")
    .withIndex("by_host_status", (q) => q.eq("hostId", userId).eq("status", "waiting"))
    .take(PER_TABLE);
  for (const lobby of lobbies) await del(lobby._id);

  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .take(PER_TABLE);
  for (const session of sessions) {
    const tokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .take(500);
    for (const token of tokens) await del(token._id);
    await del(session._id);
  }

  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .take(PER_TABLE);
  for (const account of accounts) {
    const codes = await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", account._id))
      .take(PER_TABLE);
    for (const code of codes) await del(code._id);
    await del(account._id);
  }

  if (await ctx.db.get(userId)) await del(userId);
  return deleted;
}
