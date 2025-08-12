import { useState } from "react";
import { motion } from "framer-motion";
import { User, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { useConvexMutationWithQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

interface UsernameSectionProps {
  currentUsername: string;
}

export function UsernameSection({ currentUsername }: UsernameSectionProps) {
  const [username, setUsername] = useState(currentUsername);

  const updateUsernameMutation = useConvexMutationWithQuery(api.profiles.updateUsername, {
    onSuccess: () => {
      toast.success("Username updated successfully!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update username");
    }
  });

  const handleUsernameUpdate = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (username === currentUsername) {
      toast.info("Username is the same as current");
      return;
    }

    updateUsernameMutation.mutate({ username });
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="rounded-xl border border-white/10 bg-black/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Username
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Current Username</label>
            <div className="text-white font-medium">{currentUsername}</div>
          </div>

          <Separator className="bg-gray-700" />

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">New Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter new username"
                className="bg-gray-700/50 border-gray-600 text-white"
                maxLength={20}
              />
              <div className="text-xs text-gray-400">
                3-20 characters, letters, numbers, and underscores only
              </div>
            </div>

            <Button
              onClick={() => void handleUsernameUpdate()}
              disabled={updateUsernameMutation.isPending || username === currentUsername}
              className="w-full flex-1"
              variant="gradient"
            >
              {updateUsernameMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Update Username
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
