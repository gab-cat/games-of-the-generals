#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const convex = new ConvexHttpClient(process.env.CONVEX_URL);

async function setupChat() {
  try {
    console.log("Setting up global chat rules...");

    // This would normally require authentication, but for setup we can run it
    // For now, we'll just log that the setup needs to be run manually
    console.log("Please run the setupChatRules mutation from the Convex dashboard or a logged-in client");
    console.log("The mutation is: api.globalChat.setupChatRules");

  } catch (error) {
    console.error("Failed to setup chat:", error);
  }
}

setupChat();
