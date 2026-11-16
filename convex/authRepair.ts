// One-off repairs for password accounts. Run by hand, dry run first, and
// repair before rehashing (rehashing needs one row per email):
//   npx convex run --prod authRepair:repairPasswordAccounts '{"dryRun":true}'
//   npx convex run --prod authRepair:rehashPlaintextPasswords '{"dryRun":true}'
import { modifyAccountCredentials } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

// Convex Auth's Scrypt output: 16-byte salt and 64-byte key, hex, joined by ":".
const SCRYPT_HASH = /^[0-9a-f]{32}:[0-9a-f]{128}$/;

export const listPlaintextPasswordAccounts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows: { email: string; secret: string }[] = [];
    for await (const account of ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) => q.eq("provider", "password"))) {
      if (account.secret && !SCRYPT_HASH.test(account.secret)) {
        rows.push({ email: account.providerAccountId, secret: account.secret });
      }
    }
    return rows;
  },
});

// The guest-to-account conversion used to store the password as typed.
// Hash those in place so the same password signs in and no plaintext stays.
export const rehashPlaintextPasswords = internalAction({
  args: { dryRun: v.boolean() },
  handler: async (ctx, { dryRun }): Promise<{ found: number; rehashed: number; failed: string[] }> => {
    const rows: { email: string; secret: string }[] = await ctx.runQuery(
      internal.authRepair.listPlaintextPasswordAccounts,
      {},
    );
    if (dryRun) return { found: rows.length, rehashed: 0, failed: [] };

    let rehashed = 0;
    const failed: string[] = [];
    for (const row of rows) {
      try {
        await modifyAccountCredentials(ctx, {
          provider: "password",
          account: { id: row.email, secret: row.secret },
        });
        rehashed++;
      } catch (error) {
        failed.push(`${row.email}: ${(error as Error).message}`);
      }
    }
    return { found: rows.length, rehashed, failed };
  },
});

// Two kinds of bad password rows block sign-in, sign-up and password reset
// for an email, because Convex Auth expects exactly one row per email:
// - Duplicates: a double-submitted guest conversion inserted the same row
//   twice. Keep the oldest when every copy has the same user and secret.
// - Orphans: the user row was deleted. Point the account at the live user
//   with the same email, or delete it when there is none.
export const repairPasswordAccounts = internalMutation({
  args: { dryRun: v.boolean() },
  handler: async (ctx, { dryRun }) => {
    const results: {
      email: string;
      action: "deduped" | "relinked" | "deleted" | "skipped";
      userId?: string;
    }[] = [];

    const byEmail = new Map<string, Doc<"authAccounts">[]>();
    for await (const account of ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) => q.eq("provider", "password"))) {
      const rows = byEmail.get(account.providerAccountId) ?? [];
      rows.push(account);
      byEmail.set(account.providerAccountId, rows);
    }

    for (const [email, rows] of byEmail) {
      if (rows.length < 2) continue;
      const [keep, ...extras] = rows.sort((a, b) => a._creationTime - b._creationTime);
      const identical = extras.every((r) => r.userId === keep.userId && r.secret === keep.secret);
      if (!identical) {
        results.push({ email, action: "skipped" });
        byEmail.delete(email);
        continue;
      }
      results.push({ email, action: "deduped", userId: keep.userId });
      if (!dryRun) for (const r of extras) await ctx.db.delete(r._id);
      byEmail.set(email, [keep]);
    }

    for (const [email, [account]] of byEmail) {
      if (await ctx.db.get("users", account.userId)) continue;

      const liveUsers = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .take(2);

      if (liveUsers.length === 1) {
        results.push({ email, action: "relinked", userId: liveUsers[0]._id });
        if (!dryRun) await ctx.db.patch(account._id, { userId: liveUsers[0]._id });
      } else if (liveUsers.length === 0) {
        results.push({ email, action: "deleted" });
        if (!dryRun) await ctx.db.delete(account._id);
      } else {
        // Two live users share the email: leave it for a person to decide.
        results.push({ email, action: "skipped" });
      }
    }
    return { dryRun, results };
  },
});
