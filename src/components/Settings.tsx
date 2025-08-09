"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useConvexQuery, useConvexMutationWithQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { AvatarUpload } from "./AvatarUpload";
import { toast } from "sonner";
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Save,
  Eye,
  EyeOff,
  Camera
} from "lucide-react";

export function Settings() {
  const { data: profile, isPending: isLoadingProfile, error: profileError } = useConvexQuery(api.profiles.getCurrentProfile);
  
  const updateUsernameMutation = useConvexMutationWithQuery(api.profiles.updateUsername, {
    onSuccess: () => {
      toast.success("Username updated successfully!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update username");
    }
  });

  const changePasswordMutation = useConvexMutationWithQuery(api.settings.changePassword, {
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.message || "Failed to change password");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    }
  });

  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Set username when profile loads
  if (profile && username === "") {
    setUsername(profile.username);
  }

  if (profileError) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-red-400 text-center"
        >
          <p>Error loading profile: {profileError.message}</p>
        </motion.div>
      </div>
    );
  }

  if (isLoadingProfile || !profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"
        />
      </div>
    );
  }

  const handleUsernameUpdate = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (username === profile.username) {
      toast.info("Username is the same as current");
      return;
    }

    updateUsernameMutation.mutate({ username });
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-3">
          <SettingsIcon className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-gray-400">Manage your account preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Avatar Settings */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Avatar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AvatarUpload 
                username={profile.username}
                currentAvatarUrl={profile.avatarUrl}
                rank={profile.rank}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Username Settings */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Username
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Current Username</label>
                <div className="text-white font-medium">{profile.username}</div>
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
                  disabled={updateUsernameMutation.isPending || username === profile.username}
                  className="w-full bg-blue-600 hover:bg-blue-700"
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

        {/* Password Settings */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="bg-gray-700/50 border-gray-600 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="bg-gray-700/50 border-gray-600 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Confirm New Password</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="bg-gray-700/50 border-gray-600 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-gray-400 space-y-1">
                  <div>Password requirements:</div>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>At least 8 characters long</li>
                    <li>Contains uppercase and lowercase letters</li>
                    <li>Contains at least one number</li>
                  </ul>
                </div>

                <Button
                  onClick={() => void handlePasswordChange()}
                  disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {changePasswordMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Account Information */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300">Username</label>
                <div className="text-white font-medium">{profile.username}</div>
              </div>
              <div>
                <label className="text-sm text-gray-300">Rank</label>
                <div className="text-white font-medium">{profile.rank}</div>
              </div>
              <div>
                <label className="text-sm text-gray-300">Games Played</label>
                <div className="text-white font-medium">{profile.gamesPlayed}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300">Wins</label>
                <div className="text-white font-medium">{profile.wins}</div>
              </div>
              <div>
                <label className="text-sm text-gray-300">Losses</label>
                <div className="text-white font-medium">{profile.losses}</div>
              </div>
              <div>
                <label className="text-sm text-gray-300">Member Since</label>
                <div className="text-white font-medium">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
