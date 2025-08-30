import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 00:00 UTC
crons.cron(
  "Delete anonymous users (daily 00:00 UTC)",
  "0 0 * * *",
  internal.maintenance.deleteAnonymousUsers,
  {}
);

// Run daily at 00:05 UTC to clean finished lobbies
crons.cron(
  "Cleanup finished lobbies (daily 00:05 UTC)",
  "5 0 * * *",
  internal.maintenance.cleanupFinishedLobbies,
  {}
);

// Run daily at 00:10 UTC to delete old messages (> 7 days)
crons.cron(
  "Delete messages older than 7 days (daily 00:10 UTC)",
  "10 0 * * *",
  internal.maintenance.deleteOldMessages,
  {}
);

// Run hourly to clean up old global chat messages (> 3 days)
crons.cron(
  "Cleanup old global chat messages (> 3 days)",
  "0 * * * *", // Every hour
  internal.globalChat.cleanupOldMessages,
  {}
);

// Run every 5 minutes to mark inactive users as offline
crons.cron(
  "Mark inactive users as offline",
  "*/5 * * * *", // Every 5 minutes
  internal.globalChat.cleanupOfflineUsers,
  {}
);

// Run every hour to clean up expired bans and mutes
crons.cron(
  "Cleanup expired moderation actions",
  "0 * * * *", // Every hour
  internal.globalChat.cleanupExpiredModeration,
  {}
);

export default crons;


