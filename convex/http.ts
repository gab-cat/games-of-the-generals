import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import router from "./router";
import { unsubscribe } from "./emailCampaigns";

const http = router;

http.route({
    method: "GET",
    path: "/health",
    handler: httpAction(async () => {
        return Response.json({
            status: "ok",
            message: "Convex is running!",
            environment: process.env.ENV,
        })
    })
})

// One-click unsubscribe for announcement emails (link in the footer and List-Unsubscribe).
http.route({ method: "GET", path: "/email/unsubscribe", handler: unsubscribe });
http.route({ method: "POST", path: "/email/unsubscribe", handler: unsubscribe });

auth.addHttpRoutes(http);

export default http;
