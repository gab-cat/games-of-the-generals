import { Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Shared helper to determine if a subscription is currently active.
 * Handles all subscription statuses including grace periods.
 * 
 * @param status - The subscription status
 * @param expiresAt - The expiration timestamp (null for free tier)
 * @param gracePeriodEndsAt - The grace period end timestamp (optional)
 * @returns true if the subscription is active, false otherwise
 */
export function isSubscriptionActive(
  status: string,
  expiresAt: number | null,
  gracePeriodEndsAt: number | null
): boolean {
  // Free tier or no expiry - always active
  if (!expiresAt) return true;
  
  // Explicitly canceled or expired
  if (status === "canceled") return false;
  if (status === "expired") return false;
  
  const now = Date.now();
  
  // Grace period status - check if still within grace period
  if (status === "grace_period") {
    return gracePeriodEndsAt ? gracePeriodEndsAt > now : false;
  }
  
  // Active status - check expiry, but also allow grace period if expiry passed
  if (expiresAt > now) return true;
  
  // Expiry passed but may still be in grace period (before cron updates status)
  return gracePeriodEndsAt ? gracePeriodEndsAt > now : false;
}

/**
 * Get subscription context for a user.
 * Consolidates subscription lookup and status computation.
 * 
 * @param ctx - Convex context
 * @param userId - User ID
 * @returns Subscription context with tier, status, and isActive flag
 */
export async function getSubscriptionContext(ctx: MutationCtx | QueryCtx, userId: Id<"users">) {
  // Use .first() or take(1) instead of .unique() to handle rare cases of duplicate subscription records
  // ordered by _creationTime desc to pick the most recent one
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .first();

  const tier = subscription?.tier || "free";
  const status = subscription?.status || "active";
  const expiresAt = subscription?.expiresAt || null;
  const gracePeriodEndsAt = subscription?.gracePeriodEndsAt || null;
  const isActive = isSubscriptionActive(status, expiresAt, gracePeriodEndsAt);

  return {
    subscription,
    tier,
    status,
    expiresAt,
    gracePeriodEndsAt,
    isActive,
  };
}
