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

export default crons;


