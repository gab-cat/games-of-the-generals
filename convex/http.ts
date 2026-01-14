import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import router from "./router";

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

auth.addHttpRoutes(http);

export default http;
