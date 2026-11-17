/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as PasswordResetOTP from "../PasswordResetOTP.js";
import type * as achievements from "../achievements.js";
import type * as adminDashboard from "../adminDashboard.js";
import type * as adminRoles from "../adminRoles.js";
import type * as aiGame from "../aiGame.js";
import type * as announcements from "../announcements.js";
import type * as auth from "../auth.js";
import type * as authRepair from "../authRepair.js";
import type * as cloudflareEmail from "../cloudflareEmail.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as customizations from "../customizations.js";
import type * as emailChangeVerification from "../emailChangeVerification.js";
import type * as emailPreview from "../emailPreview.js";
import type * as emails_catalog from "../emails/catalog.js";
import type * as emails_layout from "../emails/layout.js";
import type * as emails_templates from "../emails/templates.js";
import type * as featureGating from "../featureGating.js";
import type * as fileUpload from "../fileUpload.js";
import type * as gameArchive from "../gameArchive.js";
import type * as gamePresence from "../gamePresence.js";
import type * as games from "../games.js";
import type * as globalChat from "../globalChat.js";
import type * as helpers_subscriptionHelpers from "../helpers/subscriptionHelpers.js";
import type * as http from "../http.js";
import type * as lib_matchHistoryCursor from "../lib/matchHistoryCursor.js";
import type * as lib_planPricing from "../lib/planPricing.js";
import type * as lib_replayCodec from "../lib/replayCodec.js";
import type * as lib_userCleanup from "../lib/userCleanup.js";
import type * as liveGames from "../liveGames.js";
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
import type * as seasonReset from "../seasonReset.js";
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
  PasswordResetOTP: typeof PasswordResetOTP;
  achievements: typeof achievements;
  adminDashboard: typeof adminDashboard;
  adminRoles: typeof adminRoles;
  aiGame: typeof aiGame;
  announcements: typeof announcements;
  auth: typeof auth;
  authRepair: typeof authRepair;
  cloudflareEmail: typeof cloudflareEmail;
  comments: typeof comments;
  crons: typeof crons;
  customizations: typeof customizations;
  emailChangeVerification: typeof emailChangeVerification;
  emailPreview: typeof emailPreview;
  "emails/catalog": typeof emails_catalog;
  "emails/layout": typeof emails_layout;
  "emails/templates": typeof emails_templates;
  featureGating: typeof featureGating;
  fileUpload: typeof fileUpload;
  gameArchive: typeof gameArchive;
  gamePresence: typeof gamePresence;
  games: typeof games;
  globalChat: typeof globalChat;
  "helpers/subscriptionHelpers": typeof helpers_subscriptionHelpers;
  http: typeof http;
  "lib/matchHistoryCursor": typeof lib_matchHistoryCursor;
  "lib/planPricing": typeof lib_planPricing;
  "lib/replayCodec": typeof lib_replayCodec;
  "lib/userCleanup": typeof lib_userCleanup;
  liveGames: typeof liveGames;
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
  seasonReset: typeof seasonReset;
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
  actionRetrier: import("@convex-dev/action-retrier/_generated/component.js").ComponentApi<"actionRetrier">;
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
  shardedCounter: import("@convex-dev/sharded-counter/_generated/component.js").ComponentApi<"shardedCounter">;
};
