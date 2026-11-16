import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useConvexMutationWithQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import {
  Field,
  SaveMessage,
  SettingsCard,
  plainError,
  type SaveStatus,
} from "./components/SettingsCard";

interface UsernameSectionProps {
  currentUsername: string;
}

function validateUsername(value: string): string | null {
  if (value.length < 3) return "Use at least 3 characters.";
  if (value.length > 20) return "Use 20 characters or fewer.";
  if (!/^[a-zA-Z0-9_-]+$/.test(value))
    return "Use letters, numbers, underscores and hyphens only.";
  return null;
}

export function UsernameSection({ currentUsername }: UsernameSectionProps) {
  const [username, setUsername] = useState(currentUsername);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<SaveStatus>(null);

  const trimmed = username.trim();
  const unchanged = trimmed === currentUsername;
  const validation = trimmed ? validateUsername(trimmed) : "Enter a username.";
  const showError = touched && !unchanged ? validation : null;

  const updateUsernameMutation = useConvexMutationWithQuery(
    api.profiles.updateUsername,
    {
      onSuccess: () => {
        setStatus({ kind: "success", message: "Username saved." });
        toast.success("Username saved");
      },
      onError: (error) => {
        const message = plainError(
          error,
          "Could not save the username. Try again.",
        );
        setStatus({ kind: "error", message });
        toast.error(message);
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setStatus(null);
    if (unchanged || validation) return;
    updateUsernameMutation.mutate({ username: trimmed });
  };

  return (
    <SettingsCard
      title="Username"
      description="Other players see this on the leaderboard and in games."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          label="Username"
          htmlFor="settings-username"
          hint="3 to 20 characters. Letters, numbers, underscores and hyphens."
          error={showError}
        >
          <Input
            id="settings-username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setStatus(null);
            }}
            onBlur={() => setTouched(true)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={20}
            aria-invalid={!!showError}
            aria-describedby={
              showError ? "settings-username-error" : "settings-username-hint"
            }
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="secondary"
            disabled={updateUsernameMutation.isPending || unchanged}
          >
            {updateUsernameMutation.isPending && (
              <Loader2 className="animate-spin" />
            )}
            {updateUsernameMutation.isPending ? "Saving" : "Save username"}
          </Button>
          <SaveMessage status={status} />
        </div>
      </form>
    </SettingsCard>
  );
}
