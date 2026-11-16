import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import {
  Field,
  SaveMessage,
  SettingsCard,
  plainError,
  type SaveStatus,
} from "./components/SettingsCard";
import { PasswordInput } from "./components/PasswordInput";

export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [status, setStatus] = useState<SaveStatus>(null);

  const changePasswordAction = useAction(api.settings.changePassword);

  const currentError =
    touched.current && !currentPassword ? "Enter your current password." : null;
  const newError =
    touched.next && newPassword && newPassword.length < 8
      ? "Use at least 8 characters."
      : touched.next && !newPassword
        ? "Enter a new password."
        : null;
  const confirmError =
    touched.confirm && confirmPassword && newPassword !== confirmPassword
      ? "The passwords do not match."
      : touched.confirm && !confirmPassword
        ? "Enter the new password again."
        : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ current: true, next: true, confirm: true });
    setStatus(null);

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword ||
      newPassword.length < 8 ||
      newPassword !== confirmPassword
    ) {
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
      });

      if (result.success) {
        setStatus({ kind: "success", message: "Password changed." });
        toast.success("Password changed");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTouched({ current: false, next: false, confirm: false });
      } else {
        const message = plainError(
          result.message,
          "Could not change the password. Check your current password.",
        );
        setStatus({ kind: "error", message });
        toast.error(message);
      }
    } catch (error) {
      const message = plainError(
        error,
        "Could not change the password. Try again.",
      );
      setStatus({ kind: "error", message });
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const length = newPassword.length;
  const strength =
    length === 0
      ? null
      : length < 8
        ? { label: "Too short", className: "text-red-400" }
        : length < 12
          ? { label: "Okay", className: "text-foreground/80" }
          : { label: "Strong", className: "text-emerald-400" };

  return (
    <SettingsCard title="Password" description="Use at least 8 characters.">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
        noValidate
      >
        <Field
          label="Current password"
          htmlFor="settings-current-password"
          error={currentError}
        >
          <PasswordInput
            id="settings-current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setStatus(null);
            }}
            onBlur={() => setTouched((t) => ({ ...t, current: true }))}
            autoComplete="current-password"
            aria-invalid={!!currentError}
          />
        </Field>

        <Field
          label={
            <span className="flex items-center justify-between gap-2">
              <span>New password</span>
              {strength && (
                <span className={`text-xs font-normal ${strength.className}`}>
                  {strength.label}
                </span>
              )}
            </span>
          }
          htmlFor="settings-new-password"
          error={newError}
        >
          <PasswordInput
            id="settings-new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setStatus(null);
            }}
            onBlur={() => setTouched((t) => ({ ...t, next: true }))}
            autoComplete="new-password"
            aria-invalid={!!newError}
          />
        </Field>

        <Field
          label="Confirm new password"
          htmlFor="settings-confirm-password"
          error={confirmError}
        >
          <PasswordInput
            id="settings-confirm-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setStatus(null);
            }}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            autoComplete="new-password"
            aria-invalid={!!confirmError}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="secondary"
            disabled={
              isChangingPassword ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
          >
            {isChangingPassword && <Loader2 className="animate-spin" />}
            {isChangingPassword ? "Saving" : "Change password"}
          </Button>
          <SaveMessage status={status} />
        </div>
      </form>
    </SettingsCard>
  );
}
