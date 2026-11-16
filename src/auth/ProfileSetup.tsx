import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useConvexMutationWithQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { riseIn } from "../lib/motion";

const MIN_LENGTH = 3;
const MAX_LENGTH = 20;

/** Plain-words problem with a username, or null when it is fine. */
function checkUsername(value: string): string | null {
  if (value.length < MIN_LENGTH) {
    return `Use at least ${MIN_LENGTH} characters.`;
  }
  if (value.length > MAX_LENGTH) {
    return `Use ${MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

export function ProfileSetup() {
  const [username, setUsername] = useState("");
  // Validation shows on blur or submit, never while typing.
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const createProfile = useConvexMutationWithQuery(
    api.profiles.createOrUpdateProfile,
    {
      onSuccess: (_data, variables) => {
        toast.success(`Welcome, ${variables?.username ?? "General"}.`);
      },
      onError: (error) => {
        console.error("Profile creation error:", error);
        const message = error instanceof Error ? error.message : "";
        setServerError(
          message.includes("already taken")
            ? "That username is taken. Try another."
            : "Couldn't save your username. Try again.",
        );
      },
    },
  );

  const clientError = touched ? checkUsername(username) : null;
  const error = clientError ?? serverError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const trimmed = username.trim();
    if (checkUsername(trimmed)) return;
    setServerError(null);
    createProfile.mutate({ username: trimmed });
  };

  return (
    <div className="mx-auto w-full max-w-md py-4 sm:py-12">
      <motion.div
        {...riseIn}
        className="rounded-lg border border-border bg-card p-5 sm:p-6"
      >
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">
          Choose a username
        </h1>
        <p className="mt-2 text-sm text-foreground/80">
          Other players see this name in lobbies, games and on the leaderboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.replace(/\s/g, ""));
                setServerError(null);
              }}
              onBlur={() => username && setTouched(true)}
              placeholder="Username"
              maxLength={MAX_LENGTH}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              disabled={createProfile.isPending}
              aria-invalid={error ? true : undefined}
              aria-describedby="username-hint"
            />
            <p
              id="username-hint"
              role={error ? "alert" : undefined}
              className={
                error ? "text-sm text-red-300" : "text-xs text-foreground/70"
              }
            >
              {error ??
                `${MIN_LENGTH} to ${MAX_LENGTH} characters. Spaces are removed.`}
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={createProfile.isPending || !username.trim()}
          >
            {createProfile.isPending && <Loader2 className="animate-spin" />}
            {createProfile.isPending ? "Saving" : "Continue"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
