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

// Run every hour to delete inactive waiting lobbies (>30 minutes)
crons.cron(
  "Delete inactive waiting lobbies (>30 minutes)",
  "0 * * * *", // Every hour
  internal.lobbies.deleteInactiveLobbies,
  {}
);

export default crons;


