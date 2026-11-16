import { defineApp } from "convex/server";
import actionRetrier from "@convex-dev/action-retrier/convex.config";
import presence from "@convex-dev/presence/convex.config";
import shardedCounter from "@convex-dev/sharded-counter/convex.config";

const app = defineApp();
app.use(actionRetrier)
app.use(presence)
app.use(shardedCounter)

export default app;
