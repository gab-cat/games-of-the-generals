import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/support-resolve")({
  beforeLoad: () => {
    // Redirect to the new admin tickets route
    throw redirect({
      to: "/admin/tickets",
    });
  },
  component: () => null,
});
