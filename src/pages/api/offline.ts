import { NextApiRequest, NextApiResponse } from "next";
// import { ConvexHttpClient } from "convex/browser";
// import { api } from "../../../convex/_generated/api";

// const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // For sendBeacon, we need to handle the data differently
    // The data might be in req.body or we might need to read it from the stream
    const data = req.body;

    if (data && data.action === "markOffline") {
      // Since sendBeacon doesn't include auth headers, we'll need to handle this differently
      // For now, we'll just acknowledge the request
      // In a real implementation, you might want to use a different approach
      console.log("Received offline beacon");
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error handling offline beacon:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
