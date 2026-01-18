import { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { SettingsCard } from "./components/SettingsCard";
import { cn } from "@/lib/utils";

export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const changePasswordAction = useAction(api.settings.changePassword);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All authorization fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Access codes do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password protocol requires minimum 8 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
      });

      if (result.success) {
        toast.success("Security credentials updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Security update failed",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getStrengthColor = (pass: string) => {
    if (!pass) return "bg-zinc-800";
    if (pass.length < 8) return "bg-red-500";
    if (pass.length < 12) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <SettingsCard
      title="Access Codes"
      description="Start new authorization sequence."
      icon={<Lock className="w-5 h-5" />}
      delay={0.25}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
            Current Access Code
          </label>
          <div className="relative group">
            <Input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-black/20 border-white/10 text-white pr-10 font-mono tracking-widest focus:border-red-500/50 focus:ring-red-500/20"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-zinc-500 hover:text-red-400 transition-colors"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-5 pt-4 border-t border-white/5">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
                New Access Code
              </label>
              {newPassword && (
                <div className="flex gap-1 h-1 w-12">
                  <div
                    className={cn(
                      "h-full w-full rounded-full transition-all duration-300",
                      getStrengthColor(newPassword),
                    )}
                  />
                </div>
              )}
            </div>
            <div className="relative group">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-black/20 border-white/10 text-white pr-10 font-mono tracking-widest focus:border-blue-500/50 focus:ring-blue-500/20"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-zinc-500 hover:text-blue-400 transition-colors"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
              Confirm Access Code
            </label>
            <div className="relative group">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "bg-black/20 border-white/10 text-white pr-10 font-mono tracking-widest focus:border-blue-500/50 focus:ring-blue-500/20",
                  confirmPassword &&
                    newPassword !== confirmPassword &&
                    "border-red-500/30 text-red-400",
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-zinc-500 hover:text-blue-400 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400">
              Security Protocol
            </span>
          </div>
          <ul className="text-[10px] font-mono text-zinc-500 space-y-1 list-disc list-inside">
            <li>Minimum 8 characters length</li>
            <li>Alpha-numeric complexity required</li>
            <li>Case-sensitive encryption</li>
          </ul>
        </div>

        <Button
          onClick={() => void handlePasswordChange()}
          disabled={
            isChangingPassword ||
            !currentPassword ||
            !newPassword ||
            !confirmPassword
          }
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs uppercase tracking-wider h-10 border border-white/10 hover:border-green-500/50 hover:text-green-400 transition-colors"
        >
          {isChangingPassword ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>ENCRYPTING...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              <span>UPDATE CREDENTIALS</span>
            </div>
          )}
        </Button>
      </div>
    </SettingsCard>
  );
}
