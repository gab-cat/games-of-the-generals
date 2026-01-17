import { useState } from "react";
import { User, Save, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useConvexMutationWithQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { SettingsCard } from "./components/SettingsCard";

interface UsernameSectionProps {
  currentUsername: string;
}

export function UsernameSection({ currentUsername }: UsernameSectionProps) {
  const [username, setUsername] = useState(currentUsername);

  const updateUsernameMutation = useConvexMutationWithQuery(
    api.profiles.updateUsername,
    {
      onSuccess: () => {
        toast.success("Callsign updated successfully");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to update username",
        );
      },
    },
  );

  const handleUsernameUpdate = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (username === currentUsername) {
      toast.info("Username is unchanged");
      return;
    }

    updateUsernameMutation.mutate({ username });
  };

  return (
    <SettingsCard
      title="Callsign Designation"
      description="Modify your public display identifier."
      icon={<User className="w-5 h-5" />}
      delay={0.15}
    >
      <div className="space-y-6">
        <div className="grid gap-2">
          <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
            Current Callsign
          </label>
          <div className="bg-black/40 border border-white/5 p-3 rounded-sm text-zinc-300 font-mono">
            {currentUsername}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
            New Designation
          </label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter new username"
            className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 font-mono"
            maxLength={20}
          />
          <div className="flex items-start gap-2 text-[10px] text-zinc-500 font-mono">
            <AlertCircle className="w-3 h-3 mt-0.5 text-zinc-600" />
            <span>
              REQUIREMENTS: 3-20 CHARACTERS, ALPHANUMERIC & UNDERSCORES ONLY
            </span>
          </div>
        </div>

        <Button
          onClick={() => void handleUsernameUpdate()}
          disabled={
            updateUsernameMutation.isPending || username === currentUsername
          }
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider h-10 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
        >
          {updateUsernameMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>UPDATING RECORDS...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="w-3.5 h-3.5" />
              <span>UPDATE CALLSIGN</span>
            </div>
          )}
        </Button>
      </div>
    </SettingsCard>
  );
}
