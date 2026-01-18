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

// Run daily at 00:02 UTC to delete all presence rooms
crons.cron(
  "Delete all presence rooms (daily 00:02 UTC)",
  "2 0 * * *",
  internal.maintenance.deleteAllPresenceRooms,
  {}
);

// Run daily at 00:03 UTC to cleanup presence table records
crons.cron(
  "Cleanup presence table records (daily 00:03 UTC)",
  "3 0 * * *",
  internal.maintenance.cleanupPresenceTable,
  {}
);

// Run daily at 00:05 UTC to clean finished lobbies
crons.cron(
  "Cleanup finished lobbies (daily 00:05 UTC)",
  "5 0 * * *",
  internal.maintenance.cleanupFinishedLobbies,
  {}
);

// Run 4 times daily to delete old messages (> 7 days) - every 6 hours
crons.cron(
  "Delete messages older than 7 days (every 6 hours)",
  "10 */6 * * *",
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


// Run every hour to clean up expired bans and mutes
crons.cron(
  "Cleanup expired moderation actions",
  "0 * * * *", // Every hour
  internal.globalChat.cleanupExpiredModeration,
  {}
);

// Run every 5 minutes to delete inactive waiting lobbies (>5 minutes without activity)
// This is a failsafe - primary cleanup happens via heartbeat-based abandonment detection
crons.cron(
  "Delete inactive waiting lobbies (>5 minutes)",
  "*/5 * * * *", // Every 5 minutes
  internal.lobbies.deleteInactiveLobbies,
  {}
);

// Run every 6 hours to delete expired notifications (>7 days old)
crons.cron(
  "Delete expired notifications (>7 days old)",
  "20 */6 * * *", // Every 6 hours at minute 20
  internal.notifications.deleteExpiredNotifications,
  {}
);

// Run every 10 minutes to cleanup stale games (>10 minutes)
// This is a failsafe - primary cleanup happens via scheduled handleSetupTimeout
crons.cron(
  "Cleanup stale games (>10 minutes)",
  "*/10 * * * *", // Every 10 minutes
  internal.games.cleanupStaleGames,
  {}
);

// Run every 6 hours to cleanup stale AI game sessions (>1 hour old)
crons.cron(
  "Cleanup stale AI game sessions (>1 hour old)",
  "30 */6 * * *", // Every 6 hours at minute 30
  internal.aiGame.cleanupStaleAIGameSessions,
  {}
);

// Run every hour to check and update expired subscriptions
crons.cron(
  "Check and update expired subscriptions",
  "5 * * * *", // Every hour at minute 5 (staggered from other hourly jobs)
  internal.subscriptions.checkAndUpdateExpiredSubscriptions,
  {}
);

// Run daily at 00:10 UTC (08:10 Philippines time) to send expiry notifications
crons.cron(
  "Send subscription expiry notifications",
  "10 0 * * *", // Daily at 00:10 UTC
  internal.subscriptions.sendExpiryNotifications,
  {}
);

// Run daily at 00:15 UTC (08:15 Philippines time) to reset daily usage counters
crons.cron(
  "Reset daily subscription usage counters",
  "15 0 * * *", // Daily at 00:15 UTC
  internal.subscriptions.resetDailyUsage,
  {}
);

export default crons;


