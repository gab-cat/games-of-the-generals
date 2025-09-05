import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config";
import actionRetrier from "@convex-dev/action-retrier/convex.config";
import presence from "@convex-dev/presence/convex.config";
import shardedCounter from "@convex-dev/sharded-counter/convex.config";

const app = defineApp();
app.use(resend);
app.use(actionRetrier)
app.use(presence)
app.use(shardedCounter)

export default app;
