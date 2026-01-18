---
name: Freemium Transition Plan - Prepaid Model
overview: Updated plan for freemium transition using prepaid subscription model (one-time payments) instead of recurring subscriptions. Users pay manually to extend their subscription expiry date, with unlimited advance payments and expiry notifications.
todos:
  - id: schema-subscriptions-prepaid
    content: Create subscription schema tables (subscriptions with expiresAt, subscriptionPayments, subscriptionUsage, subscriptionNotifications, donations) in convex/schema.ts
    status: completed
  - id: subscription-functions-prepaid
    content: Create convex/subscriptions.ts with queries, mutations, and actions for prepaid subscription management (expiry tracking, payment extension)
    status: completed
  - id: paymongo-payment-intent
    content: Create convex/paymongo.ts with PayMongo Payment Intent API client (not Subscription API) and webhook signature verification
    status: completed
  - id: feature-gating-expiry
    content: Create convex/featureGating.ts with feature access checking functions that verify subscription expiry status
    status: completed
  - id: webhook-payment-events
    content: Add PayMongo webhook handler to convex/http.ts for processing payment.succeeded and payment.failed events
    status: completed
  - id: expiry-cron-job
    content: Create cron job in convex/crons.ts to check expired subscriptions and update status (active → grace_period → expired)
    status: completed
  - id: expiry-notifications
    content: Create expiry notification system that sends warnings at 7d, 3d, 1d, and on expiry day
    status: completed
  - id: payment-extension-flow
    content: "Create payment extension flow: calculate new expiry date, create PayMongo payment intent, extend expiry on success"
    status: completed
  - id: setup-preset-limits-expiry
    content: Update convex/setupPresets.ts to enforce preset limits and check subscription expiry status
    status: completed
  - id: private-lobby-limits-expiry
    content: Update convex/lobbies.ts to enforce daily private lobby limits and check subscription expiry status
    status: completed
  - id: ai-difficulty-gating-expiry
    content: Update convex/aiGame.ts to restrict AI difficulty levels based on subscription tier and expiry status
    status: completed
  - id: replay-tracking-expiry
    content: "Create replay tracking system with limits and expiry checks (Free: 1, Pro: 50, Pro+: 100)"
    status: completed
  - id: avatar-upload-gating-expiry
    content: Update convex/profiles.ts to restrict custom avatar uploads to Pro/Pro+ tiers with expiry checks
    status: completed
  - id: pricing-page-payment
    content: Update src/pages/pricing/00.pricing-page.tsx to integrate PayMongo payment flow and show expiry information
    status: completed
  - id: subscription-management-page
    content: Create src/pages/subscription/00.subscription-page.tsx for subscription management with expiry display and payment extension
    status: completed
  - id: payment-components
    content: Create subscription UI components (PaymentButton, ExpiryCountdown, ExpiryWarningBanner, ExtendSubscriptionModal)
    status: completed
  - id: grace-period-warning
    content: Create GracePeriodWarning component and implement 2-day grace period logic with warnings
    status: completed
  - id: update-setup-presets-ui-expiry
    content: Update src/components/setup-presets/SetupPresets.tsx to show limits, expiry warnings, and renewal prompts
    status: completed
  - id: update-lobby-ui-expiry
    content: Update src/pages/lobby/03.lobby-list-tab.tsx to show private lobby usage, limits, and expiry checks
    status: completed
  - id: update-ai-game-ui-expiry
    content: Update src/components/ai-game/AIGameBoard.tsx to disable locked AI difficulties with expiry-aware upgrade prompts
    status: completed
  - id: daily-usage-reset
    content: Create cron job in convex/crons.ts to reset daily usage counters at midnight (Philippines timezone)
    status: completed
  - id: user-migration-prepaid
    content: Create migration script to set all existing users to free tier and initialize subscription records (no expiry or far future)
    status: completed
  - id: matchmaking-priority-expiry
    content: Update convex/matchmaking.ts to give Pro/Pro+ users priority only if subscription not expired
    status: completed
  - id: chat-feature-gating-expiry
    content: Update convex/globalChat.ts to restrict extended chat features to Pro/Pro+ with expiry checks
    status: completed
  - id: layout-expiry-banner
    content: Add expiry warning banner to src/components/Layout.tsx that shows when subscription is expiring or in grace period
    status: completed
isProject: false
---

# Freemium Transition Plan: Games of the Generals (Prepaid Model)

## Overview

This plan outlines the complete transition of Games of the Generals from a free application to a freemium model with three subscription tiers:

- **Free**: Core gameplay with limitations
- **Pro**: ₱99/month - Enhanced features
- **Pro+**: ₱199/month - Premium features

**Payment Model**: Prepaid subscriptions using PayMongo one-time payments. Users pay manually to extend their subscription expiry date. Payments can be stacked unlimited months in advance.

## Architecture Overview

```
┌─────────────────┐
│   Frontend      │
│  (React/TSX)    │
│                 │
│ - Pricing Page  │
│ - Subscription  │
│   Management    │
│ - Expiry        │
│   Notifications │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Convex        │
│   Backend       │
│                 │
│ - Subscriptions │
│ - Expiry Dates  │
│ - Payment       │
│   Processing    │
│ - Notifications │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PayMongo      │
│   API           │
│                 │
│ - Payment       │
│   Intents       │
│ - Webhooks      │
│   (payment.*)   │
└─────────────────┘
```

## Key Differences from Recurring Model

1. **No Recurring Subscriptions**: Uses PayMongo Payment Intents (one-time payments) instead of Subscription API
2. **Manual Payment Extension**: Users manually pay to add months to their expiry date
3. **Payment Stacking**: Users can pay unlimited months in advance
4. **Expiry-Based Access**: Features gated by expiry date, not recurring billing
5. **Grace Period**: 2-day grace period after expiry with warnings before lockout
6. **Simplified Webhooks**: Only handle `payment.succeeded` and `payment.failed` events

## Phase 1: Database Schema & Backend Foundation

### 1.1 Subscription Schema (`convex/schema.ts`)

Add new tables to track subscriptions and usage:

**subscriptions table:**

- `userId`: Reference to users
- `tier`: "free" | "pro" | "pro_plus"
- `status`: "active" | "expired" | "grace_period" | "canceled"
- `expiresAt`: Timestamp (when subscription expires)
- `gracePeriodEndsAt`: Optional timestamp (expiresAt + 2 days)
- `createdAt`: Timestamp (when first subscription was created)
- `lastPaymentAt`: Timestamp (when last payment was processed)
- `totalMonthsPaid`: Number (total months ever paid, for analytics)
- Indexes: `by_user`, `by_status`, `by_expires_at` (for expiry checks)

**subscriptionPayments table:**

- `userId`: Reference to users
- `tier`: "pro" | "pro_plus" (tier being paid for)
- `amount`: Number (payment amount in PHP)
- `months`: Number (months added by this payment, typically 1)
- `paymongoPaymentId`: PayMongo payment intent ID
- `paymongoPaymentIntentId`: PayMongo payment intent ID
- `status`: "pending" | "succeeded" | "failed"
- `expiresAtBefore`: Timestamp (expiry before this payment)
- `expiresAtAfter`: Timestamp (expiry after this payment)
- `createdAt`: Timestamp
- Indexes: `by_user`, `by_status`, `by_paymongo_payment_id`

**subscriptionUsage table:**

- `userId`: Reference to users
- `date`: Date string (YYYY-MM-DD)
- `privateLobbiesCreated`: Number (daily counter)
- `aiReplaysSaved`: Number (daily counter)
- `lastResetAt`: Timestamp
- Indexes: `by_user_date`, `by_user`

**subscriptionNotifications table:**

- `userId`: Reference to users
- `type`: "expiry_warning_7d" | "expiry_warning_3d" | "expiry_warning_1d" | "expiry_today" | "expired"
- `expiresAt`: Timestamp (subscription expiry date)
- `sentAt`: Timestamp (when notification was sent)
- `readAt`: Optional timestamp (when user acknowledged)
- `dismissed`: Boolean (if user dismissed the notification)
- Indexes: `by_user`, `by_user_type`, `by_expires_at`

**donations table:**

- `userId`: Reference to users
- `amount`: Number (in PHP)
- `paymongoPaymentId`: PayMongo payment intent ID
- `status`: "pending" | "succeeded" | "failed"
- `donorPerks`: Array of perk strings
- `createdAt`: Timestamp
- Indexes: `by_user`, `by_status`

### 1.2 Subscription Management Functions (`convex/subscriptions.ts`)

**Queries:**

- `getCurrentSubscription`: Get user's active subscription with tier, status, and expiry date
- `getSubscriptionUsage`: Get today's usage counts for rate limiting
- `checkFeatureAccess`: Check if user has access to a specific feature (checks expiry)
- `getExpiryNotifications`: Get pending expiry notifications for user
- `getPaymentHistory`: Get user's payment history

**Mutations:**

- `createOrUpdateSubscription`: Initialize or update subscription after payment
- `extendSubscription`: Add months to expiry date when payment succeeds
- `updateSubscriptionStatus`: Update status based on expiry (active → grace_period → expired)
- `cancelSubscription`: Cancel user's subscription (set to expired)
- `incrementUsage`: Increment daily usage counters (private lobbies, replays)
- `resetDailyUsage`: Reset daily counters (cron job)
- `markNotificationRead`: Mark expiry notification as read/dismissed

**Actions:**

- `createPayMongoPayment`: Create PayMongo payment intent for subscription extension
- `createPayMongoDonation`: Create PayMongo payment intent for donation
- `handlePayMongoWebhook`: Process PayMongo webhook events (payment.succeeded, payment.failed)

**Internal Functions:**

- `checkAndUpdateExpiredSubscriptions`: Check for expired subscriptions and update status
- `sendExpiryNotifications`: Send expiry warnings (7d, 3d, 1d, today)

### 1.3 Feature Gating Utilities (`convex/featureGating.ts`)

Create centralized feature checking functions:

- `checkSubscriptionActive`: Verify subscription is active (not expired, not in grace period)
- `checkSetupPresetLimit`: Verify user can create more custom presets
- `checkPrivateLobbyLimit`: Verify user can create private lobby today
- `checkAIDifficultyAccess`: Verify user can access AI difficulty level
- `checkReplayLimit`: Verify user can save more replays
- `checkFeatureAccess`: Generic feature access checker
- `getUserLimits`: Get all limits for current user tier
- `getDaysUntilExpiry`: Calculate days until subscription expires

## Phase 2: PayMongo Integration (One-Time Payments)

### 2.1 PayMongo Configuration

**Environment Variables:**

- `PAYMONGO_SECRET_KEY`: PayMongo secret API key
- `PAYMONGO_PUBLIC_KEY`: PayMongo public API key (for frontend)
- `PAYMONGO_WEBHOOK_SECRET`: Webhook signature verification secret

**PayMongo Client Setup (`convex/paymongo.ts`):**

- Initialize PayMongo SDK/client
- Helper functions for Payment Intent API calls
- Webhook signature verification
- Payment intent creation and confirmation

### 2.2 Payment Flow

**Frontend (`src/components/subscription/PaymentButton.tsx`):**

- Button component for paying to extend subscription
- Shows current expiry date and new expiry date after payment
- Calls Convex action to create PayMongo payment intent
- Uses PayMongo Elements/Checkout for payment
- Handles payment success/failure
- Updates UI after successful payment

**Backend (`convex/subscriptions.ts` - `createPayMongoPayment` action):**

- Validate user wants to extend subscription
- Calculate new expiry date (current expiry + 1 month, or current time + 1 month if expired)
- Create PayMongo payment intent with:
  - Amount: ₱99 for Pro, ₱199 for Pro+
  - Description: "Pro Subscription - 1 month" or "Pro+ Subscription - 1 month"
  - Metadata: userId, tier, months, currentExpiresAt, newExpiresAt
- Return payment intent client secret for frontend
- Store pending payment record

### 2.3 Payment Confirmation Flow

**Frontend:**

- After PayMongo payment succeeds, call Convex mutation to confirm payment
- Show success message with new expiry date
- Refresh subscription status

**Backend (`convex/subscriptions.ts` - `confirmPayment` mutation):**

- Verify payment intent status with PayMongo
- Extend subscription expiry date
- Update subscription status to "active"
- Record payment in subscriptionPayments table
- Send confirmation notification

### 2.4 Webhook Handler (`convex/http.ts`)

Add PayMongo webhook endpoint:

- Verify webhook signature
- Parse webhook event
- Route to appropriate handler:
  - `payment.succeeded` → Extend subscription expiry, update payment status
  - `payment.failed` → Mark payment as failed, notify user
  - Handle idempotency (prevent duplicate processing)

## Phase 3: Expiry Management & Notifications

### 3.1 Expiry Status Updates (`convex/crons.ts`)

**Daily Cron Job:**

- Check all subscriptions with `expiresAt` in the past
- Update status: `active` → `grace_period` (if within 2 days) → `expired`
- Set `gracePeriodEndsAt` timestamp
- Run every hour or daily at midnight (Philippines timezone)

### 3.2 Expiry Notifications (`convex/notifications.ts` or new `convex/subscriptionNotifications.ts`)

**Notification Triggers:**

- 7 days before expiry: "Your subscription expires in 7 days"
- 3 days before expiry: "Your subscription expires in 3 days"
- 1 day before expiry: "Your subscription expires tomorrow"
- On expiry day: "Your subscription expires today"
- After expiry (grace period): "Your subscription has expired. Renew now to continue access"

**Implementation:**

- Daily cron job checks subscriptions expiring in 7, 3, 1 days, and today
- Creates notification records in `subscriptionNotifications` table
- Sends in-app notifications (use existing notification system)
- Optionally send email/push notifications

**Notification Display:**

- Show banner/alert on relevant pages when subscription is expiring
- Show in notification center
- Dismissible but reappears if not renewed

### 3.3 Grace Period Handling

**Implementation:**

- 2-day grace period after expiry
- During grace period:
  - Status: "grace_period"
  - Show warnings but allow full feature access
  - Show prominent renewal prompts
- After grace period:
  - Status: "expired"
  - Lock premium features
  - Show upgrade prompts instead of feature access

## Phase 4: Feature Gating Implementation

### 4.1 Setup Presets (`convex/setupPresets.ts`)

**Modify `saveSetupPreset` mutation:**

- Check subscription tier and expiry status
- Enforce limits: Free (2 custom), Pro (unlimited), Pro+ (unlimited)
- Return clear error messages when limit exceeded or expired
- Show expiry warning if in grace period

### 4.2 Private Lobby Limits (`convex/lobbies.ts`)

**Modify `createLobby` mutation:**

- Check if lobby is private
- If private, check subscription tier, expiry status, and daily usage count
- Enforce limits: Free (10/day), Pro (50/day), Pro+ (unlimited)
- Increment usage counter on creation
- Return error if limit exceeded or subscription expired

### 4.3 AI Difficulty Access (`convex/aiGame.ts`)

**Modify AI game creation:**

- Check subscription tier and expiry status before allowing Hard difficulty
- Check subscription tier before allowing custom AI behaviors
- Free: Easy/Medium only
- Pro: Easy/Medium/Hard + custom behaviors (if not expired)
- Pro+: All difficulties + elite AI personalities (if not expired)

### 4.4 Game Replay Limits (`convex/games.ts` or new `convex/replays.ts`)

**Create replay tracking:**

- Track saved replays per user
- Enforce limits: Free (1), Pro (50), Pro+ (100)
- Check subscription expiry before saving replays
- Auto-delete oldest replays when limit exceeded
- Add replay management UI

### 4.5 Avatar Customization (`convex/profiles.ts`)

**Modify `updateAvatar` mutation:**

- Check subscription tier and expiry status for custom avatar upload
- Free: Limited avatar selection only
- Pro: Custom avatar upload allowed (if not expired)
- Pro+: Custom avatars + premium frames (if not expired)

### 4.6 Advanced Features

**Game Analysis Tools:**

- Check subscription tier and expiry before showing analysis features
- Pro/Pro+ only (if not expired)

**Priority Matchmaking (`convex/matchmaking.ts`):**

- Check subscription tier and expiry
- Pro/Pro+ users get priority in queue (if not expired)

**Extended Chat Features (`convex/globalChat.ts`):**

- Check subscription for longer messages
- Check subscription for custom username colors
- Pro/Pro+ only (if not expired)

**Custom Lobby Settings (`convex/lobbies.ts`):**

- Check subscription before allowing custom settings
- Pro/Pro+ only (if not expired)

## Phase 5: Frontend Updates

### 5.1 Pricing Page (`src/pages/pricing/00.pricing-page.tsx`)

**Updates:**

- Connect "Upgrade" buttons to payment flow
- Show current subscription status and expiry date
- Display usage limits and current usage
- Handle donation flow with PayMongo
- Show upgrade prompts when limits reached
- Show expiry warnings if subscription expiring soon

### 5.2 Subscription Management Page (`src/pages/subscription/00.subscription-page.tsx`)

**New page with:**

- Current subscription tier and status display
- Expiry date countdown timer
- "Extend Subscription" button (pay for 1 more month)
- Payment history table
- Usage statistics dashboard
- Expiry notifications display
- Option to pay multiple months in advance (show calendar/date picker for target expiry)

### 5.3 Payment Components (`src/components/subscription/`)

**New components:**

- `PaymentButton.tsx`: Button to initiate payment for subscription extension
- `ExpiryCountdown.tsx`: Display days until expiry with visual indicator
- `ExpiryWarningBanner.tsx`: Banner showing expiry warnings
- `PaymentHistory.tsx`: Table showing past payments
- `ExtendSubscriptionModal.tsx`: Modal for extending subscription with payment

### 5.4 Feature Gate Components (`src/components/subscription/`)

**New components:**

- `FeatureGate.tsx`: Wrapper component that shows upgrade/expiry prompt if feature locked
- `UsageLimitDisplay.tsx`: Show current usage vs limit
- `UpgradePrompt.tsx`: Modal/popup prompting upgrade or renewal
- `SubscriptionBadge.tsx`: Display user's tier badge with expiry indicator
- `GracePeriodWarning.tsx`: Warning banner during grace period

### 5.5 Update Existing Components

**Setup Presets (`src/components/setup-presets/SetupPresets.tsx`):**

- Show preset count and limits
- Disable "Save Preset" button when limit reached or subscription expired
- Show upgrade/renewal prompt

**Lobby Creation (`src/pages/lobby/03.lobby-list-tab.tsx`):**

- Check private lobby limit before allowing creation
- Show daily usage counter
- Show upgrade/renewal prompt when limit reached or expired

**AI Game (`src/components/ai-game/AIGameBoard.tsx`):**

- Disable Hard difficulty for Free users or expired Pro users
- Show upgrade/renewal prompt for locked difficulties

**Profile Page (`src/pages/profile/00.profile-page.tsx`):**

- Show subscription tier badge with expiry date
- Link to subscription management
- Show feature availability based on tier and expiry
- Show expiry warnings

**Layout/Navigation (`src/components/Layout.tsx`):**

- Show expiry warning banner at top when subscription expiring
- Show grace period warning when in grace period
- Link to subscription management page

## Phase 6: Usage Tracking & Rate Limiting

### 6.1 Daily Usage Tracking (`convex/subscriptions.ts`)

**Implementation:**

- Track private lobby creation per day
- Track AI replay saves per day
- Reset counters daily via cron job
- Store in `subscriptionUsage` table
- Check expiry status before allowing usage

### 6.2 Rate Limiting Middleware

**Create utility functions:**

- `checkAndIncrementUsage`: Check limit and expiry, increment if allowed
- `getRemainingUsage`: Get remaining usage for today
- Used in mutations that create limited resources

## Phase 7: Migration & Data Handling

### 7.1 Existing User Migration

**Migration script (`convex/migrations.ts`):**

- Set all existing users to "free" tier
- Initialize subscription records with status "active" and no expiry (or far future date)
- Preserve all existing data
- Optionally offer free trial period (e.g., 30 days Pro for existing users)

### 7.2 Payment Stacking Logic

**Implementation:**

- When user pays, calculate new expiry:
  - If subscription active: `newExpiresAt = currentExpiresAt + 1 month`
  - If subscription expired: `newExpiresAt = now + 1 month`
- Allow unlimited stacking (no maximum limit)
- Show projected expiry date before payment
- Update expiry date atomically when payment succeeds

## Phase 8: Testing & Validation

### 8.1 Unit Tests

- Test expiry date calculations
- Test payment stacking logic
- Test feature gating with expiry status
- Test grace period handling
- Test notification triggers

### 8.2 Integration Tests

- Test PayMongo payment intent creation
- Test webhook handling for payment events
- Test subscription extension flow
- Test expiry status updates

### 8.3 E2E Tests

- Test complete payment flow
- Test feature access with different expiry statuses
- Test limit enforcement
- Test expiry notifications

## Phase 9: Monitoring & Analytics

### 9.1 Subscription Metrics

**Track:**

- Active subscriptions by tier
- Average subscription duration
- Payment frequency patterns
- Expiry and renewal rates
- Grace period usage
- Feature usage by tier
- Payment success/failure rates

### 9.2 Error Handling

- Log PayMongo API errors
- Log webhook processing errors
- Alert on payment failures
- Monitor subscription expiry patterns
- Track notification delivery success

## Implementation Priority

### High Priority (MVP)

1. Database schema for subscriptions (prepaid model)
2. PayMongo payment intent integration
3. Subscription expiry tracking and status updates
4. Basic feature gating (setup presets, private lobbies)
5. Payment extension flow
6. Subscription management page

### Medium Priority

7. Expiry notifications (7d, 3d, 1d, today)
8. Grace period implementation
9. Advanced feature gating (AI difficulty, replays, avatars)
10. Usage tracking and daily limits
11. Payment history display

### Low Priority (Post-MVP)

12. Advanced analytics dashboard
13. Email notifications for expiry
14. Promotional campaigns
15. Referral system

## Key Files to Modify/Create

### Backend (Convex)

- `convex/schema.ts` - Add subscription tables (prepaid model)
- `convex/subscriptions.ts` - NEW: Subscription management with expiry tracking
- `convex/paymongo.ts` - NEW: PayMongo Payment Intent client
- `convex/featureGating.ts` - NEW: Feature access utilities with expiry checks
- `convex/http.ts` - Add webhook endpoint for payment events
- `convex/crons.ts` - Add expiry checks and notification triggers
- `convex/setupPresets.ts` - Add preset limit checks with expiry
- `convex/lobbies.ts` - Add private lobby limits with expiry
- `convex/aiGame.ts` - Add difficulty access checks with expiry
- `convex/profiles.ts` - Add avatar upload checks with expiry
- `convex/notifications.ts` - Add expiry notification sending

### Frontend

- `src/pages/pricing/00.pricing-page.tsx` - Connect to payment flow, show expiry
- `src/pages/subscription/00.subscription-page.tsx` - NEW: Subscription management with payment
- `src/components/subscription/PaymentButton.tsx` - NEW: Payment button component
- `src/components/subscription/ExpiryCountdown.tsx` - NEW: Expiry countdown display
- `src/components/subscription/ExpiryWarningBanner.tsx` - NEW: Expiry warning banner
- `src/components/subscription/ExtendSubscriptionModal.tsx` - NEW: Payment modal
- `src/components/subscription/FeatureGate.tsx` - NEW: Feature gate wrapper
- `src/components/subscription/GracePeriodWarning.tsx` - NEW: Grace period warning
- `src/components/setup-presets/SetupPresets.tsx` - Add limit checks and expiry warnings
- `src/pages/lobby/03.lobby-list-tab.tsx` - Add private lobby limits and expiry checks
- `src/components/ai-game/AIGameBoard.tsx` - Add difficulty gates with expiry
- `src/components/Layout.tsx` - Add expiry warning banner

## Security Considerations

1. **Webhook Security**: Always verify PayMongo webhook signatures
2. **Payment Verification**: Always verify payment status with PayMongo before extending subscription
3. **Expiry Validation**: Always check expiry server-side, never trust frontend
4. **Rate Limiting**: Prevent abuse of free tier limits
5. **Idempotency**: Handle duplicate webhook events gracefully
6. **Payment Amount Validation**: Verify payment amount matches tier pricing

## Success Metrics

- Payment conversion rate
- Average subscription duration
- Renewal rate after expiry
- Grace period conversion rate
- Feature usage distribution across tiers
- Payment success rate

## Timeline Estimate

- **Phase 1-2** (Foundation & Payment): 2-3 weeks
- **Phase 3** (Expiry & Notifications): 1-2 weeks
- **Phase 4** (Feature Gating): 2-3 weeks
- **Phase 5** (Frontend): 2 weeks
- **Phase 6-7** (Tracking & Migration): 1 week
- **Phase 8-9** (Testing & Monitoring): 1-2 weeks

**Total Estimated Time**: 9-13 weeks for complete implementation
