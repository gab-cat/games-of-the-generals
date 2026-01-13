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

      console.log("[Webhook] Parsed signature - timestamp:", parsedSignature.timestamp);
      console.log("[Webhook] Parsed signature - has test sig:", !!parsedSignature.testSignature);
      console.log("[Webhook] Parsed signature - has live sig:", !!parsedSignature.liveSignature);

      // Get request body
      const body = await request.text();
      console.log("[Webhook] Request body length:", body.length);

      // Parse webhook event to determine livemode
      let eventData: any;
      let isLiveMode = false;
      try {
        eventData = JSON.parse(body);
        // Check livemode from event structure: data.attributes.livemode
        isLiveMode = eventData?.data?.attributes?.livemode === true;
        console.log("[Webhook] Event livemode:", isLiveMode);
      } catch (parseError) {
        console.error("[Webhook] Failed to parse event data for livemode check:", parseError);
        // Continue with signature verification using test signature as fallback
      }

      // Select appropriate signature based on livemode
      const signature = isLiveMode ? parsedSignature.liveSignature : parsedSignature.testSignature;
      
      if (!signature) {
        const mode = isLiveMode ? "live" : "test";
        console.error(`[Webhook] Missing ${mode} signature in header`);
        return new Response(`Missing ${mode} signature`, { status: 400 });
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

      console.log("[Webhook] Signature verified successfully");

      // Parse webhook event structure
      // PayMongo structure: { data: { id, type, attributes: { type, livemode, data: { id, type, attributes: {...} } } } } }
      const eventType = eventData?.data?.attributes?.type || eventData?.type;
      const eventId = eventData?.data?.id || eventData?.id;
      
      console.log("[Webhook] Event type:", eventType);
      console.log("[Webhook] Event ID:", eventId);

      // Navigate to payment data: data.attributes.data.attributes
      const paymentAttributes = eventData?.data?.attributes?.data?.attributes;
      const paymentData = eventData?.data?.attributes?.data;
      
      if (!paymentAttributes || !paymentData) {
        console.error("[Webhook] Invalid event structure - missing payment data");
        console.log("[Webhook] Event data structure:", JSON.stringify(eventData, null, 2));
        // Return 200 to prevent PayMongo retries for malformed events
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
      console.log("[Webhook] Metadata:", JSON.stringify(metadata));

      // Handle different event types (payment.paid, payment.succeeded, payment.failed)
      const isSuccessEvent = eventType === "payment.paid" || eventType === "payment.succeeded";
      const isFailedEvent = eventType === "payment.failed";

      if (isSuccessEvent) {
        console.log("[Webhook] Processing success event");

        // Find payment record - try by payment ID first, then by payment intent ID
        let payment = await ctx.runQuery(internal.subscriptions.findPaymentByPayMongoId, {
          paymongoPaymentId: paymentId,
        });

        if (!payment && paymentIntentId) {
          console.log("[Webhook] Payment not found by payment ID, trying payment intent ID");
          payment = await ctx.runQuery(internal.subscriptions.findPaymentByPayMongoIntentId, {
            paymongoPaymentIntentId: paymentIntentId,
          });
        }

        // If not found by IDs, try finding by paymentId in metadata (for checkout sessions)
        if (!payment && metadata.paymentId) {
          console.log("[Webhook] Payment not found by IDs, trying metadata paymentId");
          const paymentIdFromMetadata = metadata.paymentId as string;
          const paymentDoc = await ctx.runQuery(internal.subscriptions.getPaymentById, {
            paymentId: paymentIdFromMetadata as any,
          });
          if (paymentDoc) {
            payment = paymentDoc;
            console.log("[Webhook] Found payment via metadata, updating with PayMongo IDs");
            // Update the payment record with the actual payment IDs
            await ctx.runMutation(internal.subscriptions.updatePaymentRecordWithPayMongoIds, {
              paymentId: paymentDoc._id,
              paymongoPaymentId: paymentId,
              paymongoPaymentIntentId: paymentIntentId || "",
            });
          }
        }

        if (payment) {
          console.log("[Webhook] Found payment record, extending subscription");
          console.log("[Webhook] Payment record ID:", payment._id);
          console.log("[Webhook] Payment months:", payment.months);
          
          // Extend subscription using payment ID (not payment intent ID)
          await ctx.runMutation(internal.subscriptions.extendSubscriptionInternal, {
            paymongoPaymentId: paymentId,
            months: payment.months,
          });
          console.log("[Webhook] Subscription extended successfully");
        } else {
          console.log("[Webhook] No payment record found for payment ID:", paymentId);
        }

        // Check if it's a donation - try by payment ID first
        let donation = await ctx.runQuery(internal.subscriptions.findDonationByPayMongoId, {
          paymongoPaymentId: paymentId,
        });

        // If not found by payment ID, try finding by donationId in metadata (for checkout sessions)
        if (!donation && metadata.donationId) {
          console.log("[Webhook] Donation not found by payment ID, trying metadata donationId");
          const donationId = metadata.donationId as Id<"donations">;
          const donationDoc = await ctx.runQuery(internal.subscriptions.getDonationById, {
            donationId: donationId,
          });
          if (donationDoc) {
            donation = donationDoc;
            console.log("[Webhook] Found donation via metadata, updating with PayMongo ID");
            // Update the donation record with the actual payment ID
            await ctx.runMutation(internal.subscriptions.updateDonationRecordWithPayMongoId, {
              donationId: donationDoc._id,
              paymongoPaymentId: paymentId,
            });
          }
        }

        if (donation) {
          console.log("[Webhook] Found donation record, updating status to succeeded");
          console.log("[Webhook] Donation record ID:", donation._id);
          // Update donation status
          await ctx.runMutation(internal.subscriptions.updateDonationStatus, {
            donationId: donation._id,
            status: "succeeded",
          });
          console.log("[Webhook] Donation status updated successfully");
          
          // Update donor status on profile
          await ctx.runMutation(internal.subscriptions.updateDonorStatus, {
            userId: donation.userId,
            donationAmount: donation.amount,
          });
          console.log("[Webhook] Donor status updated successfully");
        } else {
          console.log("[Webhook] No donation record found for payment ID:", paymentId);
        }
      } else if (isFailedEvent) {
        console.log("[Webhook] Processing failed event");

        // Find payment record - try by payment ID first, then by payment intent ID
        let payment = await ctx.runQuery(internal.subscriptions.findPaymentByPayMongoId, {
          paymongoPaymentId: paymentId,
        });

        if (!payment && paymentIntentId) {
          console.log("[Webhook] Payment not found by payment ID, trying payment intent ID");
          payment = await ctx.runQuery(internal.subscriptions.findPaymentByPayMongoIntentId, {
            paymongoPaymentIntentId: paymentIntentId,
          });
        }

        // If not found by IDs, try finding by paymentId in metadata (for checkout sessions)
        if (!payment && metadata.paymentId) {
          console.log("[Webhook] Payment not found by IDs, trying metadata paymentId");
          const paymentIdFromMetadata = metadata.paymentId as string;
          const paymentDoc = await ctx.runQuery(internal.subscriptions.getPaymentById, {
            paymentId: paymentIdFromMetadata as any,
          });
          if (paymentDoc) {
            payment = paymentDoc;
          }
        }

        if (payment) {
          console.log("[Webhook] Found payment record, updating status to failed");
          console.log("[Webhook] Payment record ID:", payment._id);
          // Update payment status to failed
          await ctx.runMutation(internal.subscriptions.updatePaymentStatus, {
            paymentId: payment._id,
            status: "failed",
          });
          console.log("[Webhook] Payment status updated to failed");
        } else {
          console.log("[Webhook] No payment record found for payment ID:", paymentId);
        }

        // Check if it's a donation - try by payment ID first
        let donation = await ctx.runQuery(internal.subscriptions.findDonationByPayMongoId, {
          paymongoPaymentId: paymentId,
        });

        // If not found by payment ID, try finding by donationId in metadata (for checkout sessions)
        if (!donation && metadata.donationId) {
          console.log("[Webhook] Donation not found by payment ID, trying metadata donationId");
          const donationId = metadata.donationId as string;
          const donationDoc = await ctx.runQuery(internal.subscriptions.getDonationById, {
            donationId: donationId as any,
          });
          if (donationDoc) {
            donation = donationDoc;
          }
        }

        if (donation) {
          console.log("[Webhook] Found donation record, updating status to failed");
          console.log("[Webhook] Donation record ID:", donation._id);
          // Update donation status
          await ctx.runMutation(internal.subscriptions.updateDonationStatus, {
            donationId: donation._id,
            status: "failed",
          });
          console.log("[Webhook] Donation status updated to failed");
        } else {
          console.log("[Webhook] No donation record found for payment ID:", paymentId);
        }
      } else {
        console.log("[Webhook] Unhandled event type:", eventType);
        // Return 200 for unhandled events to prevent PayMongo retries
      }

      // Return 200 to acknowledge receipt
      console.log("[Webhook] Webhook processed successfully");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[Webhook] Webhook error:", error);
      console.error("[Webhook] Error stack:", error instanceof Error ? error.stack : "No stack trace");
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;
