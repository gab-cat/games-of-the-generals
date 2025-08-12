"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import webpush from "web-push";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Internal action: send push notifications for a message to all recipient subscriptions
export const sendPushForMessage = internalAction({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.runQuery(internal.push.getMessageById, { messageId: args.messageId });
    if (!message) return;

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const contactEmail = process.env.VAPID_CONTACT_EMAIL || "mailto:noreply@csguild.tech";

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("VAPID keys not configured; skipping web push send");
      return;
    }

    webpush.setVapidDetails(contactEmail, vapidPublicKey, vapidPrivateKey);

    const subscriptions = await ctx.runQuery(internal.push.getSubscriptionsForUser, { userId: message.recipientId });
    if (subscriptions.length === 0) return;

    const siteUrl = process.env.SITE_URL || "";
    const payload = JSON.stringify({
      title: message.senderUsername,
      body: message.content.slice(0, 140),
      url: `${siteUrl}`,
      tag: `dm-${message.senderId}`,
      data: {
        type: "message",
        senderUsername: message.senderUsername,
        messageId: message._id,
      },
    });

    await Promise.all(
      subscriptions.map(async (sub: any) => {
        const pushSub = {
          endpoint: sub.endpoint,
          expirationTime: sub.expirationTime ?? null,
          keys: sub.keys,
        } as webpush.PushSubscription;
        try {
          await webpush.sendNotification(pushSub, payload);
          await ctx.runMutation(internal.push.markPushSuccess, { subscriptionId: sub._id as Id<"pushSubscriptions"> });
        } catch (err) {
          const reason = err instanceof Error ? err.message : "push_error";
          await ctx.runMutation(internal.push.markPushFailure, { subscriptionId: sub._id as Id<"pushSubscriptions">, reason });
          // Remove Gone subscriptions
          if (typeof err === "object" && err && (err as any).statusCode === 410) {
            await ctx.runMutation(internal.push.deleteSubscriptionById, { subscriptionId: sub._id as Id<"pushSubscriptions"> });
          }
        }
      })
    );
  },
});

// Public action to send a test notification to the current user
export const sendTestNotification = action({
  args: { title: v.optional(v.string()), body: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const contactEmail = process.env.VAPID_CONTACT_EMAIL || "mailto:noreply@csguild.tech";

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured on server");
    }

    webpush.setVapidDetails(contactEmail, vapidPublicKey, vapidPrivateKey);
    const subscriptions = await ctx.runQuery(internal.push.getSubscriptionsForUser, { userId: userId as Id<"users"> });
    if (subscriptions.length === 0) {
      throw new Error("No subscriptions found");
    }

    const payload = JSON.stringify({
      title: args.title || "Games of the Generals",
      body: args.body || "Push notifications are working!",
      url: process.env.SITE_URL || "/",
      tag: `test-${userId}`,
    });

    await Promise.all(
      subscriptions.map(async (sub: any) => {
        const pushSub = {
          endpoint: sub.endpoint,
          expirationTime: sub.expirationTime ?? null,
          keys: sub.keys,
        } as webpush.PushSubscription;
        await webpush.sendNotification(pushSub, payload);
      })
    );
  },
});


