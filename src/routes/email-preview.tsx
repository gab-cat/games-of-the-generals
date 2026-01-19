import { createFileRoute } from "@tanstack/react-router";
import { EmailPreviewPage } from "../pages/email-preview";

export const Route = createFileRoute("/email-preview")({
  component: EmailPreviewPage,
});
