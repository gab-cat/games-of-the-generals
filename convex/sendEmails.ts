// This file contains email functionality for the application
// The password reset emails are handled through the auth provider
import { internalMutation } from "./_generated/server";

// Re-export moderation email functions for easy access
export { sendMuteEmail, sendBanEmail, sendUnmuteEmail, sendUnbanEmail } from "./moderationEmails";

// Placeholder for future email functionality
export const placeholder = internalMutation({
  handler: async (_ctx) => {
    // Future email functionality can be added here
    console.log("Email functionality placeholder");
  },
});
