import { createFileRoute } from "@tanstack/react-router";
import { CountdownTestPage } from "../pages/test/00.countdown-test-page";

export const Route = createFileRoute("/test-countdown")({
  component: CountdownTestPage,
});
