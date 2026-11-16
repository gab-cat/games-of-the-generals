import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "../components/LoadingSpinner";

// Lazy load auth components for better code splitting
const SignInForm = lazy(() =>
  import("../auth/SignInForm").then((module) => ({
    default: module.SignInForm,
  })),
);

function AuthComponent() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SignInForm />
    </Suspense>
  );
}

export const Route = createFileRoute("/auth")({
  component: AuthComponent,
});
