"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LogOut,
  Trophy,
  Settings,
  Gamepad2,
  ChevronDown,
  History,
  Bot,
  MessageCircle,
  HelpCircle,
  Shield,
  Newspaper,
  Headphones,
  Lock,
  ScrollText,
  Cog,
  Swords,
  Volume2,
  CreditCard,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { UserAvatar } from "./UserAvatar";
import { UserNameWithBadge } from "./UserNameWithBadge";

import { TutorialButton } from "./TutorialButton";
import Squares from "./backgrounds/Squares/Squares";
import { TutorialModal } from "./TutorialModal";
import { BanScreen } from "./BanScreen";
import { cn } from "../lib/utils";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import {
  deriveStatus,
  getStatusColorClass,
  getStatusText,
  getStatusIndicatorNode,
} from "../lib/getIndicator";
import { useMobile } from "../lib/useMobile";
import { MessageNotification } from "./messaging/MessageNotification";
import { useQuery } from "convex-helpers/react/cache";
import { useSound } from "../lib/SoundProvider";
import packageJson from "../../package.json";
import { ExpiryWarningBanner } from "./subscription/ExpiryWarningBanner";

// Lazy load components
const GlobalChatPanel = lazy(() =>
  import("./global-chat/GlobalChatPanel").then((module) => ({
    default: module.GlobalChatPanel,
  })),
);
const MessagingPanel = lazy(() =>
  import("./messaging/MessagingPanel").then((module) => ({
    default: module.MessagingPanel,
  })),
);
const MessageButton = lazy(() =>
  import("./messaging/MessageButton").then((module) => ({
    default: module.MessageButton,
  })),
);
const SupportDialog = lazy(() =>
  import("./SupportDialog").then((module) => ({
    default: module.SupportDialog,
  })),
);
const SoundSettingsDialog = lazy(() =>
  import("./SoundSettingsDialog").then((module) => ({
    default: module.SoundSettingsDialog,
  })),
);

interface LayoutProps {
  children: React.ReactNode;
  user?: {
    username: string;
  } | null;
  onOpenMessagingWithLobby?: (
    handler: (lobbyId: Id<"lobbies">) => void,
  ) => void;
}

export function Layout({
  children,
  user,
  onOpenMessagingWithLobby,
}: LayoutProps) {
  const version = packageJson.version;
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [inviteLobbyId, setInviteLobbyId] = useState<Id<"lobbies"> | null>(
    null,
  );

  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCheckedTutorial, setHasCheckedTutorial] = useState(false);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);
  const [showFooter, setShowFooter] = useState(false); // Defer footer for LCP
  const isMobile = useMobile();
  const { playBGM, stopBGM } = useSound();

  const markTutorialCompleted = useMutation(api.profiles.markTutorialCompleted);

  // Footer link data
  const quickLinks = [
    { icon: Swords, label: "Play Game", path: "/" },
    { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
    { icon: Bot, label: "VS AI", path: "/ai-game" },
    { icon: History, label: "Match History", path: "/match-history" },
    { icon: Newspaper, label: "News & Updates", path: "/announcements" },
  ];

  const supportLinks = [
    {
      icon: Headphones,
      label: "Support Center",
      path: "/support",
      search: { ticketId: undefined },
    },
    { icon: User, label: "Pricing", path: "/pricing" },
    { icon: Lock, label: "Privacy Policy", path: "/privacy" },
    { icon: ScrollText, label: "Terms of Service", path: "/terms" },
    { icon: Cog, label: "Settings", path: "/settings" },
  ];

  // Profile data doesn't change frequently, cache it for longer
  const { data: profile } = useConvexQueryWithOptions(
    api.profiles.getCurrentProfile,
    {},
    {
      staleTime: 120000, // 2 minutes - profile data changes infrequently
      gcTime: 600000, // 10 minutes cache
    },
  );

  // Defer tutorial and ban status queries for LCP optimization
  const { data: tutorialStatus } = useConvexQueryWithOptions(
    api.profiles.checkTutorialStatus,
    isAuthenticated ? {} : "skip",
    {
      enabled: !!isAuthenticated && profile !== undefined, // Wait for profile to load first
      staleTime: 300000, // 5 minutes - tutorial status doesn't change often
      gcTime: 600000, // 10 minutes cache
    },
  );

  // Defer ban check for better LCP - only load after profile is available
  const { data: isBanned } = useConvexQueryWithOptions(
    api.globalChat.isUserBanned,
    isAuthenticated && profile ? {} : "skip", // Only when profile is loaded
    {
      enabled: !!isAuthenticated && profile !== undefined,
      staleTime: 30000, // 30 seconds - ban status can change
      gcTime: 60000, // 1 minute cache
    },
  );

  // Check if tutorial should be shown on first login
  useEffect(() => {
    if (tutorialStatus && !hasCheckedTutorial && isAuthenticated) {
      if (tutorialStatus.isFirstLogin && !tutorialStatus.hasSeenTutorial) {
        setShowTutorial(true);
      }
      setHasCheckedTutorial(true);
    }
  }, [tutorialStatus, hasCheckedTutorial, isAuthenticated]);

  // Load footer collapse preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("footerCollapsed");
      if (stored === "true") {
        setIsFooterCollapsed(true);
      }
    }
  }, []);

  // Defer footer rendering for better LCP
  useEffect(() => {
    const footerTimer = setTimeout(() => {
      setShowFooter(true);
    }, 1000); // Show footer after 1 second
    return () => clearTimeout(footerTimer);
  }, []);

  // Save footer collapse preference to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("footerCollapsed", String(isFooterCollapsed));
    }
  }, [isFooterCollapsed]);

  // Prompt user to enable push after first successful auth/profile load
  useEffect(() => {
    if (!isAuthenticated) return;
    const shouldPrompt = localStorage.getItem("pushPrompted") !== "yes";
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (
      shouldPrompt &&
      vapidKey &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      // Non-blocking gentle prompt; user can also enable from Settings
      setTimeout(() => {
        try {
          void Notification.requestPermission().finally(() => {
            localStorage.setItem("pushPrompted", "yes");
          });
        } catch {
          // ignore
        }
      }, 3000);
    }
  }, [isAuthenticated]);

  // Manage main BGM - play when authenticated (except during setup/battle phases), stop when logged out
  // Don't play main BGM if we're on a game page - GameBoard/AIGameBoard will handle BGM there
  useEffect(() => {
    const isOnGamePage =
      location.pathname === "/game" ||
      location.pathname.startsWith("/game/") ||
      location.pathname === "/ai-game" ||
      location.pathname.startsWith("/ai-game/");

    if (isAuthenticated && !isBanned && !isOnGamePage) {
      playBGM("main");
    } else if (!isAuthenticated) {
      // Stop BGM when not authenticated
      stopBGM();
    }
    // If on game page, don't interfere - GameBoard/AIGameBoard will handle BGM
  }, [isAuthenticated, isBanned, location.pathname, playBGM, stopBGM]);

  const isActiveTab = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navigationItems = [
    {
      path: "/",
      label: "Lobbies",
      icon: Gamepad2,
    },
    {
      path: "/ai-game",
      label: "VS AI",
      icon: Bot,
    },
    {
      path: "/leaderboard",
      label: "Leaderboard",
      icon: Trophy,
    },
    {
      path: "/announcements",
      label: "News",
      icon: Newspaper,
    },
    // {
    //   path: "/pricing",
    //   label: "Pricing",
    //   icon: Crown
    // }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (onOpenMessagingWithLobby) {
      onOpenMessagingWithLobby((lobbyId: Id<"lobbies">) => {
        setInviteLobbyId(lobbyId);
        setIsMessagingOpen(true);
      });
    }
  }, [onOpenMessagingWithLobby]);

  const unreadCount = useQuery(api.messages.getUnreadCount, {}) || 0;
  const latestAnnouncement = useQuery(
    api.announcements.getLatestAnnouncementInfo,
  );
  const [hasSeenLatest, setHasSeenLatest] = useState(true);

  // Check if there's a new announcement
  useEffect(() => {
    if (latestAnnouncement) {
      const lastSeenId = localStorage.getItem("lastSeenAnnouncementId");
      setHasSeenLatest(lastSeenId === latestAnnouncement.id);
    }
  }, [latestAnnouncement]);

  // Mark as seen when on the announcements page
  useEffect(() => {
    if (location.pathname === "/announcements" && latestAnnouncement) {
      localStorage.setItem("lastSeenAnnouncementId", latestAnnouncement.id);
      setHasSeenLatest(true);
    }
  }, [location.pathname, latestAnnouncement]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 pb-16 lg:pb-0 no-scrollbar relative selection:bg-blue-500/30">
      {/* Global Background Grid */}
      <div className="fixed inset-0 pointer-events-none select-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-900/10 via-transparent to-transparent opacity-50" />
      </div>
      {/* Minimalist Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "sticky top-2 z-50 transition-all duration-300 max-w-7xl mx-auto rounded-lg border border-white/5",
          isScrolled
            ? "bg-zinc-900/80 backdrop-blur-md shadow-2xl shadow-black/50"
            : "bg-zinc-900/40 backdrop-blur-sm",
        )}
      >
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              initial={{
                x:
                  Math.random() *
                  (typeof window !== "undefined" ? window.innerWidth : 1200),
                y: Math.random() * 64,
                opacity: 0,
              }}
              animate={{
                x:
                  Math.random() *
                  (typeof window !== "undefined" ? window.innerWidth : 1200),
                y: Math.random() * 64,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                delay: i * 0.8,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          {/* Left Section - Logo & Title */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 flex-1 min-w-0"
          >
            {/* Tactical Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05 }}
              onClick={() =>
                void navigate({ to: "/", search: { lobbyId: undefined } })
              }
              className="relative w-10 h-10 flex items-center justify-center shrink-0 cursor-pointer group"
            >
              <div className="absolute inset-0 m-auto w-7 h-7 bg-blue-500/10 rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500 border border-blue-500/30" />
              <div className="absolute inset-0 m-auto w-7 h-7 border border-white/10 rounded-sm rotate-45 group-hover:rotate-0 transition-transform duration-500" />
              <Gamepad2 className="w-4 h-4 text-white/90 group-hover:text-white transition-colors relative z-10" />
            </motion.div>

            {/* Clean Title */}
            <div
              className="flex flex-col cursor-pointer min-w-0 group"
              onClick={() =>
                void navigate({ to: "/", search: { lobbyId: undefined } })
              }
            >
              <h1 className="text-lg font-display font-medium text-white tracking-wide leading-none group-hover:text-blue-400 transition-colors duration-300">
                <span className="tracking-[0.05em]">GAMES</span>
                <span className="mx-1.5 text-white/40 text-sm font-light italic">
                  of the
                </span>
                <span className="tracking-[0.05em]">GENERALS</span>
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">
                  System v{version}
                </span>
                <div className="flex gap-1">
                  <span className="w-0.5 h-0.5 rounded-full bg-blue-500/50" />
                  <span className="w-0.5 h-0.5 rounded-full bg-blue-500/50" />
                  <span className="w-0.5 h-0.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Middle Section - Navigation */}
          {isAuthenticated && !isBanned && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="hidden lg:flex items-center gap-1 flex-1 justify-center"
            >
              <div className="flex items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveTab(item.path);
                  return (
                    <Button
                      key={item.path}
                      variant="ghost"
                      size="sm"
                      onClick={() => void navigate({ to: item.path })}
                      className={cn(
                        "rounded-md px-3 py-1.5 transition-all duration-300 flex items-center gap-2 relative h-8 mx-0.5",
                        active
                          ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/5"
                          : "bg-transparent text-white/50 hover:text-white hover:bg-white/5 border border-transparent",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-3.5 h-3.5",
                          active ? "text-blue-400" : "opacity-70",
                        )}
                      />
                      <span
                        className={cn(
                          "hidden xl:inline text-xs font-mono uppercase tracking-wider",
                          active ? "font-bold" : "font-medium",
                        )}
                      >
                        {item.label}
                      </span>
                      {item.path === "/announcements" && !hasSeenLatest && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                      )}

                      {/* Active Indicator Line */}
                      {active && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 left-2 right-2 h-[2px] bg-blue-400/50 rounded-full"
                        />
                      )}
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Right Section - Messages & User Profile */}
          {isAuthenticated && user && !isBanned && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 flex justify-end items-center gap-2 sm:gap-3 min-w-0"
            >
              {/* Tutorial Button Wrapper */}
              <div className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                <TutorialButton
                  variant="icon"
                  size="sm"
                  className="bg-transparent border-0 p-0 hover:bg-transparent"
                />
              </div>

              {/* Message Button Wrapper */}
              <div className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors relative">
                <Suspense
                  fallback={
                    <div className="w-4 h-4 bg-white/10 rounded-full animate-pulse" />
                  }
                >
                  <MessageButton
                    unreadCount={unreadCount}
                    isActive={isMessagingOpen}
                    onClick={() => setIsMessagingOpen(!isMessagingOpen)}
                    className="bg-transparent border-0 p-0 w-full h-full flex items-center justify-center hover:bg-transparent"
                  />
                </Suspense>
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-white/10 mx-1" />

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="ghost"
                      className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex items-center gap-3 px-3 py-1.5 rounded-lg group h-9 min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center justify-end gap-1.5">
                            <UserNameWithBadge
                              username={user.username}
                              tier={
                                profile?.tier as
                                  | "free"
                                  | "pro"
                                  | "pro_plus"
                                  | undefined
                              }
                              isDonor={profile?.isDonor}
                              usernameColor={profile?.usernameColor}
                              size="xs"
                            />
                          </div>
                        </div>
                        <UserAvatar
                          username={user.username}
                          avatarUrl={profile?.avatarUrl}
                          rank={profile?.rank}
                          size="xs"
                          frame={profile?.avatarFrame}
                          className="flex-shrink-0 w-6 h-6 border-white/10"
                        />
                      </div>
                      <ChevronDown className="w-3 h-3 text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-72 bg-[#080808] border border-white/10 shadow-2xl rounded-xl mt-2 p-1.5"
                >
                  {/* User Identity Card */}
                  <div className="relative mb-2 overflow-hidden rounded-lg border border-white/5 bg-white/5 p-3">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,107,158,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] duration-1000 pointer-events-none" />
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          username={user.username}
                          avatarUrl={profile?.avatarUrl}
                          rank={profile?.rank}
                          size="md"
                          frame={profile?.avatarFrame}
                          className="ring-2 ring-black/50"
                        />
                        <div>
                          <UserNameWithBadge
                            username={user.username}
                            tier={
                              profile?.tier as
                                | "free"
                                | "pro"
                                | "pro_plus"
                                | undefined
                            }
                            isDonor={profile?.isDonor}
                            usernameColor={profile?.usernameColor}
                            size="md"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                              {(() => {
                                const status = deriveStatus({
                                  username: user.username,
                                  gameId: profile?.gameId,
                                  lobbyId: profile?.lobbyId,
                                  aiGameId: profile?.aiSessionId,
                                });
                                const node = getStatusIndicatorNode(status);
                                return node ? (
                                  <div className="flex items-center justify-center scale-75">
                                    {node}
                                  </div>
                                ) : (
                                  <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                                );
                              })()}
                              {(() => {
                                const status = deriveStatus({
                                  username: user.username,
                                  gameId: profile?.gameId,
                                  lobbyId: profile?.lobbyId,
                                  aiGameId: profile?.aiSessionId,
                                });
                                const text = getStatusText(status) ?? "Online";
                                const color = getStatusColorClass(status);
                                return (
                                  <span
                                    className={cn(
                                      "text-[10px] font-mono uppercase tracking-wider",
                                      color,
                                    )}
                                  >
                                    {text}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                          RANK
                        </span>
                        <span className="text-xs font-bold text-blue-400">
                          {profile?.rank || "UNRANKED"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Groups */}
                  <div className="space-y-1">
                    {/* Operations Group */}
                    <div className="px-2 py-1.5">
                      <h4 className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1 pl-1">
                        Operations
                      </h4>
                      <div className="space-y-0.5">
                        <DropdownMenuItem
                          onClick={() => void navigate({ to: "/profile" })}
                          className="group flex items-center justify-between px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-md cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span>Profile</span>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => void navigate({ to: "/achievements" })}
                          className="group flex items-center justify-between px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-md cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Trophy className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span>Achievements</span>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            void navigate({ to: "/match-history" })
                          }
                          className="group flex items-center justify-between px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-md cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <History className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span>Match Logs</span>
                          </div>
                        </DropdownMenuItem>
                      </div>
                    </div>

                    <DropdownMenuSeparator className="bg-white/5 mx-2" />

                    {/* System Group */}
                    <div className="px-2 py-1.5">
                      <h4 className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1 pl-1">
                        System
                      </h4>
                      <div className="space-y-0.5">
                        <DropdownMenuItem
                          onClick={() =>
                            void navigate({
                              to: "/subscription",
                              search: { subscription: undefined },
                            })
                          }
                          className="group flex items-center justify-between px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-md cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span>Subscription</span>
                          </div>
                          <span className="text-[9px] font-mono text-amber-500/80 uppercase">
                            Manage
                          </span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => setIsSoundSettingsOpen(true)}
                          className="group flex items-center justify-between px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-md cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span>Audio Config</span>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => void navigate({ to: "/settings" })}
                          className="group flex items-center justify-between px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-md cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span>Settings</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            void navigate({
                              to: "/support",
                              search: { ticketId: undefined },
                            })
                          }
                          className="group flex items-center justify-between px-2 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-md cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <HelpCircle className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span>Support Protocol</span>
                          </div>
                        </DropdownMenuItem>

                        {/* Admin Support Center - Only show for admins/mods */}
                        {profile?.adminRole && (
                          <DropdownMenuItem
                            onClick={() => void navigate({ to: "/admin" })}
                            className="group flex items-center justify-between px-2 py-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-md cursor-pointer transition-colors border border-dashed border-purple-500/20 mt-1"
                          >
                            <div className="flex items-center gap-2">
                              <Shield className="h-3.5 w-3.5" />
                              <span>Admin Console</span>
                            </div>
                          </DropdownMenuItem>
                        )}
                      </div>
                    </div>

                    <DropdownMenuSeparator className="bg-white/5 mx-2" />

                    <div className="p-1">
                      <DropdownMenuItem
                        onClick={() => {
                          void signOut();
                        }}
                        className="group flex items-center justify-center gap-2 px-2 py-2 text-xs font-bold text-red-500/80 hover:text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer transition-colors border border-transparent hover:border-red-500/20"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>TERMINATE SESSION</span>
                      </DropdownMenuItem>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
          {!isAuthenticated && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 flex justify-end items-center gap-1 sm:gap-2 min-w-0"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void navigate({ to: "/privacy" })}
                className="text-white/80 hover:text-white"
              >
                Privacy Policy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void navigate({ to: "/terms" })}
                className="text-white/80 hover:text-white"
              >
                Terms of Service
              </Button>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Expiry Warning Banner */}
      {isAuthenticated && !isBanned && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 mt-4">
          <ExpiryWarningBanner />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl min-h-[90vh] mx-auto mt-4 sm:mt-8 px-3 pb-4 sm:px-6">
        {isAuthenticated && isBanned ? <BanScreen /> : children}
      </main>

      {/* Footer - Deferred for LCP optimization */}
      {showFooter && (
        <motion.footer
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-auto"
        >
          <div
            className={cn(
              "relative backdrop-blur-xl bg-zinc-950/80 border-t border-white/5 transition-all duration-500 w-full px-4 sm:px-6 lg:px-8 overflow-hidden",
              isFooterCollapsed ? "py-2" : "py-8 sm:py-12",
            )}
          >
            {/* Ambient Light/Grid */}
            <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
              <Squares
                direction="diagonal"
                speed={0.2}
                squareSize={40}
                borderColor="rgba(255,255,255,0.1)"
              />
            </div>

            {/* Control Tab */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[1px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFooterCollapsed(!isFooterCollapsed)}
                className="h-5 px-6 rounded-b-lg rounded-t-none border-b border-x border-white/5 bg-[#050505] hover:bg-white/5 hover:border-white/10 transition-all text-[10px] text-white/30 hover:text-white/60 tracking-widest uppercase font-mono"
              >
                {isFooterCollapsed ? "EXPAND_SYSTEM" : "COLLAPSE_SYSTEM"}
              </Button>
            </div>

            <div className="relative max-w-7xl mx-auto z-10">
              <AnimatePresence initial={false}>
                {!isFooterCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-8">
                      {/* Brand Section (Col 1-4) */}
                      <div className="lg:col-span-4 space-y-6">
                        <div className="flex flex-col gap-4">
                          {/* Logo Lockup */}
                          <div
                            className="flex items-center gap-4 group cursor-pointer"
                            onClick={() =>
                              void navigate({
                                to: "/",
                                search: { lobbyId: undefined },
                              })
                            }
                          >
                            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                              <div className="absolute inset-0 m-auto w-8 h-8 bg-blue-500/10 rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500" />
                              <div className="absolute inset-0 m-auto w-8 h-8 border border-white/10 rounded-sm rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                              <Gamepad2 className="w-5 h-5 text-white/80" />
                            </div>
                            <div>
                              <h2 className="text-xl font-display font-medium text-white tracking-tight leading-none mb-1">
                                Games of Generals
                              </h2>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider bg-blue-500/10 px-1.5 py-0.5 rounded-sm">
                                  System v{version}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                              </div>
                            </div>
                          </div>

                          <p className="text-white/40 text-xs leading-relaxed font-light max-w-sm">
                            Advanced tactical warfare simulation. Engage in
                            real-time strategy battles, analyze combat data, and
                            dominate the global rankings.
                          </p>
                        </div>

                        {/* Network Stats */}
                        <div className="grid grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-sm overflow-hidden max-w-sm">
                          {[
                            { label: "NODES", value: "1.2K" },
                            { label: "BATTLES", value: "24K" },
                            { label: "UPTIME", value: "99.9%" },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className="bg-[#050505] p-3 text-center group hover:bg-white/5 transition-colors"
                            >
                              <div className="text-xs font-mono text-white/30 mb-1">
                                {stat.label}
                              </div>
                              <div className="text-sm font-bold text-white/80 group-hover:text-blue-400">
                                {stat.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Navigation (Col 5-8) */}
                      <div className="lg:col-span-2 lg:col-start-6 space-y-4">
                        <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-2">
                          Navigation
                        </h3>
                        <nav className="flex flex-col space-y-1">
                          {quickLinks.map((link) => (
                            <button
                              key={link.path}
                              onClick={() => void navigate({ to: link.path })}
                              className="group flex items-center gap-3 py-1.5 text-sm text-white/50 hover:text-white transition-colors text-left"
                            >
                              <span className="w-1 h-1 bg-white/20 rounded-full group-hover:bg-blue-400 transition-colors" />
                              {link.label}
                            </button>
                          ))}
                        </nav>
                      </div>

                      {/* Legal/Support (Col 9-10) */}
                      <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-2">
                          Protocol
                        </h3>
                        <nav className="flex flex-col space-y-1">
                          {supportLinks.map((link) => (
                            <button
                              key={link.path}
                              onClick={() =>
                                void navigate({
                                  to: link.path,
                                  search: link.search,
                                })
                              }
                              className="group flex items-center gap-3 py-1.5 text-sm text-white/50 hover:text-white transition-colors text-left"
                            >
                              <span className="w-1 h-1 bg-white/20 rounded-full group-hover:bg-amber-400 transition-colors" />
                              {link.label}
                            </button>
                          ))}
                        </nav>
                      </div>

                      {/* Connect (Col 11-12) */}
                      <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-2">
                          Comm-Link
                        </h3>
                        <div className="flex gap-2">
                          {/* Social Placeholders / External Links */}
                          <Button
                            size="icon"
                            variant="outline"
                            className="w-8 h-8 rounded-sm bg-transparent border-white/10 hover:bg-white/5 hover:text-white text-white/40"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="w-8 h-8 rounded-sm bg-transparent border-white/10 hover:bg-white/5 hover:text-white text-white/40"
                          >
                            <Swords className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Copyright / Status Line */}
                    <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono text-white/30 uppercase tracking-widest">
                      <div>
                        © {new Date().getFullYear()} // GAMES OF THE GENERALS
                        // ALL RIGHTS RESERVED
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="hover:text-white/50 cursor-pointer transition-colors">
                          PRIVACY_PROTOCOL
                        </span>
                        <span className="w-px h-3 bg-white/10" />
                        <span className="hover:text-white/50 cursor-pointer transition-colors">
                          TERM_AGREEMENT
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed State */}
              {isFooterCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-between items-center text-[10px] font-mono text-white/20 uppercase tracking-widest px-2"
                >
                  <span>SYSTEM_ONLINE</span>
                  <span>© {new Date().getFullYear()} GOG</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.footer>
      )}

      {/* Floating Global Chat Button - Desktop */}
      {isAuthenticated && !isBanned && (
        <motion.div
          initial={isMobile ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
          animate={isMobile ? { opacity: 1 } : { scale: 1, opacity: 1 }}
          transition={
            isMobile
              ? { delay: 0.6, duration: 0.2 }
              : { delay: 0.6, type: "spring", stiffness: 300, damping: 25 }
          }
          className="hidden lg:block fixed bottom-6 right-6 z-50"
        >
          <motion.div
            whileHover={isMobile ? undefined : { scale: 1.02 }}
            whileTap={isMobile ? undefined : { scale: 0.98 }}
            transition={
              isMobile
                ? { duration: 0.2 }
                : {
                    scale: { type: "spring", stiffness: 400, damping: 25 },
                  }
            }
          >
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setIsGlobalChatOpen(!isGlobalChatOpen)}
              className={cn(
                "backdrop-blur-lg border border-white/20 transition-all duration-300 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg hover:shadow-xl w-full h-full cursor-pointer",
                isGlobalChatOpen
                  ? "bg-white/15 hover:bg-white/20"
                  : "bg-black/50 hover:bg-black/60",
              )}
            >
              <motion.div
                animate={
                  isMobile
                    ? undefined
                    : {
                        rotate: isGlobalChatOpen ? 180 : 0,
                        scale: isGlobalChatOpen ? 1.05 : 1,
                      }
                }
                transition={
                  isMobile
                    ? { duration: 0.2 }
                    : {
                        rotate: { duration: 0.6, ease: "easeInOut" },
                        scale: { duration: 0.4 },
                      }
                }
              >
                <MessageCircle
                  className={cn(
                    "w-5 h-5 transition-colors duration-300",
                    isGlobalChatOpen ? "text-white" : "text-white/70",
                  )}
                />
              </motion.div>
              <motion.span
                className="text-white/90 text-sm font-medium"
                animate={
                  isMobile
                    ? undefined
                    : {
                        color: isGlobalChatOpen
                          ? "#ffffff"
                          : "rgba(255, 255, 255, 0.9)",
                      }
                }
                transition={isMobile ? { duration: 0.2 } : { duration: 0.4 }}
              >
                Global Chat
              </motion.span>
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Mobile Bottom Navigation */}
      {isAuthenticated && !isBanned && (
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/40 backdrop-blur-2xl border-t border-white/20"
        >
          <div className="flex items-center justify-around py-2 px-1 sm:py-3 sm:px-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveTab(item.path);
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => void navigate({ to: item.path })}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-2 py-5 transition-all duration-200 min-w-0 flex-1 max-w-20 sm:max-w-24 rounded-full",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10",
                  )}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs text-white font-medium text-center leading-tight w-full">
                    {item.label}
                  </span>
                </Button>
              );
            })}
            {/* Global Chat Button */}
            <motion.div
              whileHover={isMobile ? undefined : { scale: 1.02 }}
              whileTap={isMobile ? undefined : { scale: 0.98 }}
              animate={
                isMobile
                  ? undefined
                  : {
                      backgroundColor: isGlobalChatOpen
                        ? "rgba(255, 255, 255, 0.15)"
                        : "rgba(0, 0, 0, 0.3)",
                    }
              }
              transition={
                isMobile
                  ? { duration: 0.2 }
                  : {
                      backgroundColor: { duration: 0.4 },
                      scale: { type: "spring", stiffness: 400, damping: 25 },
                    }
              }
              className="flex max-w-20 sm:max-w-24 rounded-full"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsGlobalChatOpen(!isGlobalChatOpen)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-1 rounded-full transition-all duration-200 min-w-0 w-full h-full cursor-pointer",
                  isGlobalChatOpen
                    ? "text-white"
                    : "text-white/70 hover:text-white",
                )}
              >
                <motion.div
                  animate={
                    isMobile
                      ? undefined
                      : {
                          rotate: isGlobalChatOpen ? 180 : 0,
                          scale: isGlobalChatOpen ? 1.05 : 1,
                        }
                  }
                  transition={
                    isMobile
                      ? { duration: 0.2 }
                      : {
                          rotate: { duration: 0.6, ease: "easeInOut" },
                          scale: { duration: 0.4 },
                        }
                  }
                >
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                </motion.div>
                <motion.span
                  className="text-[10px] sm:text-xs text-white font-medium text-center leading-tight w-full"
                  animate={
                    isMobile
                      ? undefined
                      : {
                          color: isGlobalChatOpen
                            ? "#ffffff"
                            : "rgba(255, 255, 255, 0.7)",
                        }
                  }
                  transition={isMobile ? { duration: 0.2 } : { duration: 0.4 }}
                >
                  Chat
                </motion.span>
              </Button>
            </motion.div>
          </div>
        </motion.nav>
      )}

      {/* Global Chat Panel */}
      <Suspense fallback={null}>
        <GlobalChatPanel
          isOpen={isGlobalChatOpen}
          onToggle={() => setIsGlobalChatOpen(!isGlobalChatOpen)}
        />
      </Suspense>

      {/* Messaging Panel */}
      <Suspense fallback={null}>
        <MessagingPanel
          isOpen={isMessagingOpen}
          onClose={() => {
            setIsMessagingOpen(false);
            setInviteLobbyId(null); // Clear invite lobby ID when panel closes
          }}
          inviteLobbyId={inviteLobbyId}
          onNavigateToLobby={(lobbyId) => {
            setIsMessagingOpen(false);
            setInviteLobbyId(null);
            void navigate({ to: "/", search: { lobbyId } });
          }}
          onNavigateToGame={(gameId) => {
            setIsMessagingOpen(false);
            setInviteLobbyId(null);
            void navigate({ to: "/game", search: { gameId } });
          }}
        />
      </Suspense>

      {/* Message Notifications */}
      <MessageNotification
        onOpenMessaging={() => setIsMessagingOpen(true)}
        onNavigateToLobby={(lobbyId) => {
          void navigate({ to: "/", search: { lobbyId } });
        }}
        onNavigateToGame={(gameId) => {
          void navigate({ to: "/game", search: { gameId } });
        }}
      />

      {/* Tutorial Modal for first-time users */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => {
          markTutorialCompleted()
            .then(() => {
              toast.success(
                "Tutorial completed! Welcome to the battle, General!",
              );
            })
            .catch((error) => {
              console.error("Failed to mark tutorial as completed:", error);
            });
          setShowTutorial(false);
        }}
      />

      {/* Support Dialog */}
      <Suspense fallback={null}>
        <SupportDialog
          isOpen={isSupportDialogOpen}
          onClose={() => setIsSupportDialogOpen(false)}
        />
      </Suspense>

      {/* Sound Settings Dialog */}
      <Suspense fallback={null}>
        <SoundSettingsDialog
          isOpen={isSoundSettingsOpen}
          onClose={() => setIsSoundSettingsOpen(false)}
        />
      </Suspense>
    </div>
  );
}
