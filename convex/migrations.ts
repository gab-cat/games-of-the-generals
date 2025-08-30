import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Migration to initialize online status for existing profiles
// This runs after the schema has been updated to include online status fields in profiles
export const initializeOnlineStatus = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Initializing online status for existing profiles...");

    // Get all profiles that don't have online status set
    const profilesWithoutOnlineStatus = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("isOnline"), undefined))
      .take(1000);

    console.log(`Found ${profilesWithoutOnlineStatus.length} profiles to initialize`);

    let initialized = 0;

    for (const profile of profilesWithoutOnlineStatus) {
      try {
        // Initialize online status to false for existing profiles
        await ctx.db.patch(profile._id, {
          isOnline: false,
        });
        initialized++;
      } catch (error) {
        console.error(`Error initializing profile ${profile.userId}:`, error);
      }
    }

    console.log(`Initialization complete: ${initialized} profiles updated`);

    return {
      success: true,
      initialized,
      total: profilesWithoutOnlineStatus.length,
    };
  },
});