/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendEmailChangeVerification from "../ResendEmailChangeVerification.js";
import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as achievements from "../achievements.js";
import type * as adminDashboard from "../adminDashboard.js";
import type * as aiGame from "../aiGame.js";
import type * as announcements from "../announcements.js";
import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as customizations from "../customizations.js";
import type * as featureGating from "../featureGating.js";
import type * as fileUpload from "../fileUpload.js";
import type * as gamePresence from "../gamePresence.js";
import type * as games from "../games.js";
import type * as globalChat from "../globalChat.js";
import type * as helpers_subscriptionHelpers from "../helpers/subscriptionHelpers.js";
import type * as http from "../http.js";
import type * as lobbies from "../lobbies.js";
import type * as maintenance from "../maintenance.js";
import type * as matchmaking from "../matchmaking.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as moderationEmails from "../moderationEmails.js";
import type * as notifications from "../notifications.js";
import type * as paymongo from "../paymongo.js";
import type * as performance from "../performance.js";
import type * as presence from "../presence.js";
import type * as profiles from "../profiles.js";
import type * as push from "../push.js";
import type * as pushNode from "../pushNode.js";
import type * as router from "../router.js";
import type * as sendEmails from "../sendEmails.js";
import type * as settings from "../settings.js";
import type * as setupPresets from "../setupPresets.js";
import type * as spectate from "../spectate.js";
import type * as subscriptions from "../subscriptions.js";
import type * as supportTickets from "../supportTickets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendEmailChangeVerification: typeof ResendEmailChangeVerification;
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  achievements: typeof achievements;
  adminDashboard: typeof adminDashboard;
  aiGame: typeof aiGame;
  announcements: typeof announcements;
  auth: typeof auth;
  comments: typeof comments;
  crons: typeof crons;
  customizations: typeof customizations;
  featureGating: typeof featureGating;
  fileUpload: typeof fileUpload;
  gamePresence: typeof gamePresence;
  games: typeof games;
  globalChat: typeof globalChat;
  "helpers/subscriptionHelpers": typeof helpers_subscriptionHelpers;
  http: typeof http;
  lobbies: typeof lobbies;
  maintenance: typeof maintenance;
  matchmaking: typeof matchmaking;
  messages: typeof messages;
  migrations: typeof migrations;
  moderationEmails: typeof moderationEmails;
  notifications: typeof notifications;
  paymongo: typeof paymongo;
  performance: typeof performance;
  presence: typeof presence;
  profiles: typeof profiles;
  push: typeof push;
  pushNode: typeof pushNode;
  router: typeof router;
  sendEmails: typeof sendEmails;
  settings: typeof settings;
  setupPresets: typeof setupPresets;
  spectate: typeof spectate;
  subscriptions: typeof subscriptions;
  supportTickets: typeof supportTickets;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          createdAt: number;
          errorMessage?: string;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject: string;
          text?: string;
          to: string;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          errorMessage: string | null;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject: string;
          text?: string;
          to: string;
        },
        string
      >;
    };
  };
  actionRetrier: {
    public: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { runId: string },
        boolean
      >;
      cleanup: FunctionReference<
        "mutation",
        "internal",
        { runId: string },
        any
      >;
      start: FunctionReference<
        "mutation",
        "internal",
        {
          functionArgs: any;
          functionHandle: string;
          options: {
            base: number;
            initialBackoffMs: number;
            logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
            maxFailures: number;
            onComplete?: string;
            runAfter?: number;
            runAt?: number;
          };
        },
        string
      >;
      status: FunctionReference<
        "query",
        "internal",
        { runId: string },
        | { type: "inProgress" }
        | {
            result:
              | { returnValue: any; type: "success" }
              | { error: string; type: "failed" }
              | { type: "canceled" };
            type: "completed";
          }
      >;
    };
  };
  presence: {
    public: {
      disconnect: FunctionReference<
        "mutation",
        "internal",
        { sessionToken: string },
        null
      >;
      heartbeat: FunctionReference<
        "mutation",
        "internal",
        {
          interval?: number;
          roomId: string;
          sessionId: string;
          userId: string;
        },
        { roomToken: string; sessionToken: string }
      >;
      list: FunctionReference<
        "query",
        "internal",
        { limit?: number; roomToken: string },
        Array<{ lastDisconnected: number; online: boolean; userId: string }>
      >;
      listRoom: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; roomId: string },
        Array<{ lastDisconnected: number; online: boolean; userId: string }>
      >;
      listUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; userId: string },
        Array<{ lastDisconnected: number; online: boolean; roomId: string }>
      >;
      removeRoom: FunctionReference<
        "mutation",
        "internal",
        { roomId: string },
        null
      >;
      removeRoomUser: FunctionReference<
        "mutation",
        "internal",
        { roomId: string; userId: string },
        null
      >;
    };
  };
  shardedCounter: {
    public: {
      add: FunctionReference<
        "mutation",
        "internal",
        { count: number; name: string; shard?: number; shards?: number },
        number
      >;
      count: FunctionReference<"query", "internal", { name: string }, number>;
      estimateCount: FunctionReference<
        "query",
        "internal",
        { name: string; readFromShards?: number; shards?: number },
        any
      >;
      rebalance: FunctionReference<
        "mutation",
        "internal",
        { name: string; shards?: number },
        any
      >;
      reset: FunctionReference<"mutation", "internal", { name: string }, any>;
    };
  };
};
