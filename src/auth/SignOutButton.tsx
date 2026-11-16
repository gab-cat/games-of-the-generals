"use client";
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [pending, setPending] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => {
        setPending(true);
        signOut().catch(() => setPending(false));
      }}
    >
      {pending && <Loader2 className="animate-spin" />}
      {pending ? "Signing out" : "Sign out"}
    </Button>
  );
}
