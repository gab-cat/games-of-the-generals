import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Grants or removes the admin/moderator role for every account with this
 * email. Internal only: run it from the CLI or dashboard, e.g.
 *   npx convex run --prod adminRoles:setRoleByEmail '{"email":"a@b.com","role":"admin"}'
 * The app checks `profiles.adminRole` (verifyAdminAccess in adminDashboard.ts).
 */
export const setRoleByEmail = internalMutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("moderator"), v.null()),
  },
  handler: async (ctx, { email, role }) => {
    const users = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email.trim().toLowerCase()))
      .take(10);
    const updated: Array<{ userId: string; username: string }> = [];
    for (const user of users) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();
      if (!profile) continue;
      await ctx.db.patch(profile._id, { adminRole: role ?? undefined });
      updated.push({ userId: user._id, username: profile.username });
    }
    if (updated.length === 0) {
      throw new Error(`No account with a profile uses ${email}`);
    }
    return { role, updated };
  },
});

/** Same as setRoleByEmail, for accounts without an email (e.g. guests). */
export const setRoleByUsername = internalMutation({
  args: {
    username: v.string(),
    role: v.union(v.literal("admin"), v.literal("moderator"), v.null()),
  },
  handler: async (ctx, { username, role }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!profile) throw new Error(`No profile named ${username}`);
    await ctx.db.patch(profile._id, { adminRole: role ?? undefined });
    return { role, userId: profile.userId, username: profile.username };
  },
});
