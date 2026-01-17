import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

/**
 * PayMongo Webhook Endpoint
 * 
 * This endpoint receives webhook events from PayMongo when payment events occur.
 * 
 * URL: https://<your-convex-deployment>.convex.site/webhooks/paymongo
 * 
 * Configure this URL in your PayMongo dashboard under Webhooks settings.
 * 
 * Events handled:
 * - payment.succeeded: Extends subscription or marks donation as succeeded
 * - payment.failed: Marks payment or donation as failed
 * 
 * Security: All requests are verified using HMAC-SHA256 signature verification
 * with the PAYMONGO_WEBHOOK_SECRET environment variable.
 */
http.route({
  path: "/webhooks/paymongo",
  method: "POST",
    handler: httpAction(async (ctx, request) => {
    try {
      // Get webhook signature header
      const signatureHeader = request.headers.get("paymongo-signature");
      
      console.log("[Webhook] Received PayMongo webhook request");
      console.log("[Webhook] Signature header:", signatureHeader);

      if (!signatureHeader) {
        console.error("[Webhook] Missing paymongo-signature header");
        return new Response("Missing signature header", { status: 400 });
      }

      // Parse signature header (format: t=timestamp,te=test_sig,li=live_sig)
      const paymongoModule = await import("./paymongo");
      const parsedSignature = paymongoModule.parsePayMongoSignature(signatureHeader);
      
      if (!parsedSignature) {
        console.error("[Webhook] Invalid signature header format");
        return new Response("Invalid signature header format", { status: 400 });
      }

      const timestamp = parseInt(parsedSignature.timestamp, 10);
      const now = Math.floor(Date.now() / 1000);
      const tolerance = 5 * 60; // 5 minutes in seconds

      if (isNaN(timestamp) || Math.abs(now - timestamp) > tolerance) {
        console.error("[Webhook] Timestamp outside of tolerance window:", parsedSignature.timestamp);
        return new Response("Timestamp outside of tolerance window", { status: 400 });
      }

      console.log("[Webhook] Parsed signature - timestamp:", parsedSignature.timestamp);
      console.log("[Webhook] Parsed signature - has test sig:", !!parsedSignature.testSignature);
      console.log("[Webhook] Parsed signature - has live sig:", !!parsedSignature.liveSignature);

      // Get request body
      const body = await request.text();
      console.log("[Webhook] Request body length:", body.length);

      // Secure mode detection: prioritize live signature if available, otherwise test
      // PayMongo signs with both if it's live, or just test if it's test
      const isLiveMode = !!parsedSignature.liveSignature;
      const signature = isLiveMode ? parsedSignature.liveSignature : parsedSignature.testSignature;
      
      if (!signature) {
        console.error(`[Webhook] Missing signature in header`);
        return new Response(`Missing signature`, { status: 400 });
      }

      // Verify webhook signature
      const isValid = await paymongoModule.verifyWebhookSignature(
        body,
        signature,
        parsedSignature.timestamp,
        isLiveMode
      );
      
      if (!isValid) {
        console.error("[Webhook] Invalid signature verification");
        return new Response("Invalid signature", { status: 401 });
      }

      console.log("[Webhook] Signature verified successfully. Mode:", isLiveMode ? "live" : "test");

      // Parse webhook event structure safely
      let eventData: any;
      try {
        eventData = JSON.parse(body);
      } catch (parseError) {
        console.error("[Webhook] Failed to parse event data:", parseError);
        return new Response("Invalid JSON body", { status: 400 });
      }

      const eventType = eventData?.data?.attributes?.type || eventData?.type;
      const eventId = eventData?.data?.id || eventData?.id;
      
      console.log("[Webhook] Event type:", eventType);
      console.log("[Webhook] Event ID:", eventId);

      // Idempotency check
      if (eventId) {
        const alreadyProcessed = await ctx.runQuery(internal.subscriptions.checkWebhookEvent, { eventId });
        if (alreadyProcessed) {
          console.log("[Webhook] Event already processed, returning early:", eventId);
          return new Response(JSON.stringify({ received: true, note: "already processed" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Navigate to payment data: data.attributes.data.attributes
      const paymentAttributes = eventData?.data?.attributes?.data?.attributes;
      const paymentData = eventData?.data?.attributes?.data;
      
      if (!paymentAttributes || !paymentData) {
        console.error("[Webhook] Invalid event structure - missing payment data");
        // Return 200 to acknowledge but log as error
        return new Response(JSON.stringify({ received: true, error: "Invalid event structure" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Extract payment IDs
      const paymentId = paymentData.id; // Format: pay_...
      const paymentIntentId = paymentAttributes.payment_intent_id; // Format: pi_...
      const metadata = paymentAttributes.metadata || {};
      
      console.log("[Webhook] Payment ID:", paymentId);
      console.log("[Webhook] Payment Intent ID:", paymentIntentId);

      // Handle different event types (payment.paid, payment.succeeded, payment.failed)
      const isSuccessEvent = eventType === "payment.paid" || eventType === "payment.succeeded";
      const isFailedEvent = eventType === "payment.failed";

      if (isSuccessEvent) {
        console.log("[Webhook] Processing success event");

        // Find payment record
        let payment = await ctx.runQuery(internal.subscriptions.findPaymentByPayMongoId, {
          paymongoPaymentId: paymentId,
        });

        if (!payment && paymentIntentId) {
          payment = await ctx.runQuery(internal.subscriptions.findPaymentByPayMongoIntentId, {
            paymongoPaymentIntentId: paymentIntentId,
          });
        }

        // Metadata validation and lookup
        if (!payment && metadata.paymentId) {
          console.log("[Webhook] Trying metadata paymentId");
          const paymentDoc = await ctx.runQuery(internal.subscriptions.getPaymentById, {
            paymentId: metadata.paymentId,
          });
          if (paymentDoc) {
            payment = paymentDoc;
            console.log("[Webhook] Found payment via metadata, updating with PayMongo IDs");
            await ctx.runMutation(internal.subscriptions.updatePaymentRecordWithPayMongoIds, {
              paymentId: paymentDoc._id,
              paymongoPaymentId: paymentId,
              paymongoPaymentIntentId: paymentIntentId || "",
            });
          }
        }

        if (payment) {
          console.log("[Webhook] Found payment record, extending subscription");
          await ctx.runMutation(internal.subscriptions.extendSubscriptionInternal, {
            paymongoPaymentId: paymentId,
            months: payment.months,
          });
        }

        // Check for donation
        let donation = await ctx.runQuery(internal.subscriptions.findDonationByPayMongoId, {
          paymongoPaymentId: paymentId,
        });

        if (!donation && metadata.donationId) {
          console.log("[Webhook] Trying metadata donationId");
          const donationDoc = await ctx.runQuery(internal.subscriptions.getDonationById, {
            donationId: metadata.donationId,
          });
          if (donationDoc) {
            donation = donationDoc;
            console.log("[Webhook] Found donation via metadata, updating with PayMongo ID");
            await ctx.runMutation(internal.subscriptions.updateDonationRecordWithPayMongoId, {
              donationId: donationDoc._id,
              paymongoPaymentId: paymentId,
            });
          }
        }

        if (donation) {
          console.log("[Webhook] Found donation record, updating status");
          await ctx.runMutation(internal.subscriptions.updateDonationStatus, {
            donationId: donation._id,
            status: "succeeded",
          });
          await ctx.runMutation(internal.subscriptions.updateDonorStatus, {
            userId: donation.userId,
            donationAmount: donation.amount,
          });
        }
      } else if (isFailedEvent) {
        console.log("[Webhook] Processing failed event");

        let payment = await ctx.runQuery(internal.subscriptions.findPaymentByPayMongoId, {
          paymongoPaymentId: paymentId,
        });

        if (!payment && paymentIntentId) {
          payment = await ctx.runQuery(internal.subscriptions.findPaymentByPayMongoIntentId, {
            paymongoPaymentIntentId: paymentIntentId,
          });
        }

        if (!payment && metadata.paymentId) {
          payment = await ctx.runQuery(internal.subscriptions.getPaymentById, {
            paymentId: metadata.paymentId,
          });
        }

        if (payment) {
          await ctx.runMutation(internal.subscriptions.updatePaymentStatus, {
            paymentId: payment._id,
            status: "failed",
          });
        }

        let donation = await ctx.runQuery(internal.subscriptions.findDonationByPayMongoId, {
          paymongoPaymentId: paymentId,
        });

        if (!donation && metadata.donationId) {
          donation = await ctx.runQuery(internal.subscriptions.getDonationById, {
            donationId: metadata.donationId,
          });
        }

        if (donation) {
          await ctx.runMutation(internal.subscriptions.updateDonationStatus, {
            donationId: donation._id,
            status: "failed",
          });
        }
      }

      // Record event as processed for idempotency
      if (eventId) {
        await ctx.runMutation(internal.subscriptions.recordWebhookEvent, { eventId });
      }

      console.log("[Webhook] Webhook processed successfully");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[Webhook] Webhook error:", error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;
