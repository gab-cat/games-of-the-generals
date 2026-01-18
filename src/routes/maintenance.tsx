import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePage } from "../pages/maintenance/maintenance-page";

export const Route = createFileRoute("/maintenance")({
  component: MaintenancePage,
});
