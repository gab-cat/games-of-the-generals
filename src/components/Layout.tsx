"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Trophy, Settings, Gamepad2, ChevronDown, ChevronUp, History, Bot, MessageCircle, HelpCircle, Shield, Newspaper, Headphones, Lock, ScrollText, Cog, Swords, Volume2 } from "lucide-react";
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

import { TutorialButton } from "./TutorialButton";
import Squares from "./backgrounds/Squares/Squares";
import { TutorialModal } from "./TutorialModal";
import { BanScreen } from "./BanScreen";
import { cn } from "../lib/utils";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import { deriveStatus, getStatusColorClass, getStatusText, getStatusIndicatorNode } from "../lib/getIndicator";
import { useMobile } from "../lib/useMobile";
import { MessageNotification } from "./messaging/MessageNotification";
import { useQuery } from "convex-helpers/react/cache";
import { useSound } from "../lib/SoundProvider";
import packageJson from "../../package.json";

// Lazy load components
const GlobalChatPanel = lazy(() => import("./global-chat/GlobalChatPanel").then(module => ({ default: module.GlobalChatPanel })));
const MessagingPanel = lazy(() => import("./messaging/MessagingPanel").then(module => ({ default: module.MessagingPanel })));
const MessageButton = lazy(() => import("./messaging/MessageButton").then(module => ({ default: module.MessageButton })));
const SupportDialog = lazy(() => import("./SupportDialog").then(module => ({ default: module.SupportDialog })));
const SoundSettingsDialog = lazy(() => import("./SoundSettingsDialog").then(module => ({ default: module.SoundSettingsDialog })));


interface LayoutProps {
  children: React.ReactNode;
  user?: {
    username: string;
  } | null;
  onOpenMessagingWithLobby?: (handler: (lobbyId: Id<"lobbies">) => void) => void;
}

export function Layout({ children, user, onOpenMessagingWithLobby }: LayoutProps) {
  const version = packageJson.version;
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [inviteLobbyId, setInviteLobbyId] = useState<Id<"lobbies"> | null>(null);

  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCheckedTutorial, setHasCheckedTutorial] = useState(false);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);
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
    { icon: Headphones, label: "Support Center", path: "/support", search: { ticketId: undefined } },
    { icon: User, label: "Profile", path: "/profile" },
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
    }
  );


  // Check tutorial status - tutorial status doesn't change frequently
  const { data: tutorialStatus } = useConvexQueryWithOptions(
    api.profiles.checkTutorialStatus,
    isAuthenticated ? {} : "skip",
    {
      enabled: !!isAuthenticated,
      staleTime: 300000, // 5 minutes - tutorial status doesn't change often
      gcTime: 600000, // 10 minutes cache
    }
  );

  // Check if user is banned
  const { data: isBanned } = useConvexQueryWithOptions(
    api.globalChat.isUserBanned,
    isAuthenticated ? {} : "skip",
    {
      enabled: !!isAuthenticated,
      staleTime: 30000, // 30 seconds - ban status can change
      gcTime: 60000, // 1 minute cache
    }
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
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('footerCollapsed');
      if (stored === 'true') {
        setIsFooterCollapsed(true);
      }
    }
  }, []);

  // Save footer collapse preference to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('footerCollapsed', String(isFooterCollapsed));
    }
  }, [isFooterCollapsed]);

  // Prompt user to enable push after first successful auth/profile load
  useEffect(() => {
    if (!isAuthenticated) return;
    const shouldPrompt = localStorage.getItem('pushPrompted') !== 'yes';
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (shouldPrompt && vapidKey && 'Notification' in window && Notification.permission === 'default') {
      // Non-blocking gentle prompt; user can also enable from Settings
      setTimeout(() => {
        try {
          void Notification.requestPermission().finally(() => {
            localStorage.setItem('pushPrompted', 'yes');
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
    const isOnGamePage = location.pathname === "/game" || 
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
      icon: Gamepad2
    },
    {
      path: "/ai-game",
      label: "VS AI",
      icon: Bot
    },
    {
      path: "/leaderboard",
      label: "Leaderboard",
      icon: Trophy
    },
    {
      path: "/announcements",
      label: "News",
      icon: Newspaper
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
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 pb-16 lg:pb-0 no-scrollbar">
      {/* Minimalist Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "sticky top-2 z-50 backdrop-blur-md border-b  transition-all duration-300 max-w-7xl mx-auto rounded-full border border-white/10",
          isScrolled 
            ? "bg-black/50" 
            : "bg-black/40"
        )}
      >
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200), 
                y: Math.random() * 64,
                opacity: 0 
              }}
              animate={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                y: Math.random() * 64,
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 6 + Math.random() * 4, 
                repeat: Infinity,
                delay: i * 0.8
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
            className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0"
          >
            {/* Minimalist Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center group cursor-pointer hover:bg-white/20 transition-all duration-200 flex-shrink-0"
            >
              <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 group-hover:text-white transition-colors" />
            </motion.div>
            
            {/* Clean Title */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col cursor-pointer min-w-0 group"
              onClick={() => void navigate({ to: "/", search: { lobbyId: undefined } })}
            >
              <motion.h1
                whileHover={{
                  scale: 1.02,
                  textShadow: "0 0 8px rgba(255, 255, 255, 0.3)"
                }}
                transition={{ duration: 0.2 }}
                className="text-lg sm:text-xl font-display font-semibold text-white/95 tracking-tight truncate relative group-hover:text-white transition-colors duration-200"
              >
                <motion.span
                  className="hidden sm:inline relative"
                  whileHover={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  Games of the Generals
                </motion.span>
                <motion.span
                  className="sm:hidden relative"
                  whileHover={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  GoG
                  {/* Animated underline for mobile */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-white origin-left rounded-full"
                  />
                </motion.span>
                <motion.span
                  className="relative text-xs font-mono text-gray-400 ml-2"
                >
                  v{version}
                </motion.span>
              </motion.h1>
            </motion.div>
          </motion.div>

          {/* Middle Section - Navigation */}
          {isAuthenticated && !isBanned && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="hidden lg:flex items-center gap-2 flex-1 justify-center"
            >
              <div className="flex items-center bg-white/1 backdrop-blur-sm border border-white/20 rounded-full p-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.path}
                      variant="ghost"
                      size="sm"
                      onClick={() => void navigate({ to: item.path })}
                      className={cn(
                        "rounded-full px-4 py-2 text-white/70 transition-all duration-200 flex items-center gap-2",
                        isActiveTab(item.path)
                          ? "bg-white/20 text-white hover:bg-white/25"
                          : "bg-transparent hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden xl:inline">{item.label}</span>
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
              {/* Tutorial Button */}
              <TutorialButton variant="icon" size="md" />

              {/* Message Button */}
              <Suspense fallback={<div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />}>
                <MessageButton
                  unreadCount={unreadCount}
                  isActive={isMessagingOpen}
                  onClick={() => setIsMessagingOpen(!isMessagingOpen)}
                />
              </Suspense>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="ghost"
                      className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 rounded-full group h-10 sm:h-12 min-w-0"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-white/90 font-medium text-sm truncate">{user.username}</div>
                          <div className="flex items-center gap-1 justify-end">
                            {(() => {
                              const status = deriveStatus({ username: user.username, gameId: profile?.gameId, lobbyId: profile?.lobbyId, aiGameId: profile?.aiSessionId });
                              const node = getStatusIndicatorNode(status);
                              return node ? (
                                <div className="flex items-center justify-center">{node}</div>
                              ) : (
                                <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                              );
                            })()}
                            {(() => {
                              const status = deriveStatus({ username: user.username, gameId: profile?.gameId, lobbyId: profile?.lobbyId, aiGameId: profile?.aiSessionId });
                              const text = getStatusText(status) ?? "Online";
                              const color = getStatusColorClass(status);
                              return (
                                <span className={"text-xs " + color}>{text}</span>
                              );
                            })()}
                          </div>
                        </div>
                        <UserAvatar
                          username={user.username}
                          avatarUrl={profile?.avatarUrl}
                          rank={profile?.rank}
                          size="sm"
                          className="ring-1 ring-white/30 flex-shrink-0"
                        />
                      </div>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white/60 group-hover:text-white/90 transition-colors flex-shrink-0" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-black/50 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl mt-2"
                >
                  {/* User Header */}
                  <div className="px-3 py-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        username={user.username}
                        avatarUrl={profile?.avatarUrl}
                        rank={profile?.rank}
                        size="md"
                        className="ring-1 ring-white/20"
                      />
                      <div>
                        <div className="text-white font-medium text-sm">{user.username}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {(() => {
                            const status = deriveStatus({ username: user.username, gameId: profile?.gameId, lobbyId: profile?.lobbyId, aiGameId: profile?.aiSessionId });
                            const node = getStatusIndicatorNode(status);
                            return node ? (
                              <div className="flex items-center justify-center">{node}</div>
                            ) : (
                              <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                            );
                          })()}
                          {(() => {
                            const status = deriveStatus({ username: user.username, gameId: profile?.gameId, lobbyId: profile?.lobbyId, aiGameId: profile?.aiSessionId });
                            const text = getStatusText(status) ?? "Online";
                            const color = getStatusColorClass(status);
                            return (
                              <span className={"text-xs " + color}>{text}</span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <DropdownMenuItem
                      onClick={() => void navigate({ to: "/profile" })}
                      className="flex items-center gap-3 text-white/90 hover:bg-white/10 mx-1 rounded-md cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => void navigate({ to: "/achievements" })}
                      className="flex items-center gap-3 text-white/90 hover:bg-white/10 mx-1 rounded-md cursor-pointer"
                    >
                      <Trophy className="h-4 w-4" />
                      <span>Achievements</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => void navigate({ to: "/match-history" })}
                      className="flex items-center gap-3 text-white/90 hover:bg-white/10 mx-1 rounded-md cursor-pointer"
                    >
                      <History className="h-4 w-4" />
                      <span>Match History</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setIsSoundSettingsOpen(true)}
                      className="flex items-center gap-3 text-white/90 hover:bg-white/10 mx-1 rounded-md cursor-pointer"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>Sound</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => void navigate({ to: "/settings" })}
                      className="flex items-center gap-3 text-white/90 hover:bg-white/10 mx-1 rounded-md cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => void navigate({ to: "/support", search: { ticketId: undefined } })}
                      className="flex items-center gap-3 text-white/90 hover:bg-white/10 mx-1 rounded-md cursor-pointer"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span>Support</span>
                    </DropdownMenuItem>

                    {/* Admin Support Center - Only show for admins/mods */}
                    {profile?.adminRole && (
                      <DropdownMenuItem
                        onClick={() => void navigate({ to: "/support-resolve" })}
                        className="flex items-center gap-3 text-purple-400 hover:bg-purple-500/10 mx-1 rounded-md cursor-pointer"
                      >
                        <Shield className="h-4 w-4" />
                        <span>Admin Support</span>
                      </DropdownMenuItem>
                    )}
                  </div>

                  <DropdownMenuSeparator className="bg-white/10" />

                  <div className="py-1">
                    <DropdownMenuItem
                      onClick={() => { 
                        void signOut();
                      }}
                      className="flex items-center gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 mx-1 rounded-md"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl min-h-[90vh] mx-auto mt-4 sm:mt-8 px-3 pb-4 sm:px-6">
        {isAuthenticated && isBanned ? <BanScreen /> : children}
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className=""
      >
        <div className={cn(
          "relative backdrop-blur-sm bg-black/40 border-t border-white/10 transition-all duration-300 w-full px-4 sm:px-6 lg:px-8 overflow-hidden",
          isFooterCollapsed ? "py-3" : "py-6 sm:py-8"
        )}>
          {/* Animated Squares Background */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <Squares
              direction="diagonal"
              speed={0.3}
              squareSize={60}
              borderColor="rgba(255,255,255,0.15)"
            />
          </div>
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full"
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                  y: Math.random() * 120,
                  opacity: 0
                }}
                animate={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                  y: Math.random() * 120,
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 6 + Math.random() * 4,
                  repeat: Infinity,
                  delay: i * 0.6
                }}
              />
            ))}
          </div>

          <div className="relative max-w-7xl mx-auto z-10">
            {/* Collapse/Expand Button */}
            <div className="flex justify-center mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFooterCollapsed(!isFooterCollapsed)}
                className="text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-full px-3 py-1.5"
                aria-label={isFooterCollapsed ? "Expand footer" : "Collapse footer"}
              >
                <motion.div
                  animate={{ rotate: isFooterCollapsed ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {isFooterCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </motion.div>
              </Button>
            </div>
            {/* Main Footer Content */}
            <AnimatePresence initial={false}>
              {!isFooterCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center gap-3">
                        {/* Logo */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center group cursor-pointer hover:bg-white/20 transition-all duration-200">
                          <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 group-hover:text-white transition-colors" />
                        </div>

                        {/* Title */}
                        <div className="flex flex-col cursor-pointer group" onClick={() => void navigate({ to: "/", search: { lobbyId: undefined } })}>
                          <h2 className="text-lg sm:text-xl font-display font-semibold text-white/95 tracking-tight group-hover:text-white transition-colors duration-200">
                            Games of the Generals
                          </h2>
                          <span className="text-xs font-mono text-gray-400">
                            v{version}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-3">
                        <p className="text-white/80 text-sm leading-relaxed">
                          Experience the classic strategy board game reimagined for the digital age. Command your army, outmaneuver your opponents, and become the ultimate tactician in this timeless game of military strategy.
                        </p>
                        <p className="text-white/60 text-xs leading-relaxed">
                          Features real-time multiplayer battles, AI opponents, tournament play, and a vibrant community of strategic minds from around the world.
                        </p>
                      </div>

                      {/* Game Stats */}
                      <div className="flex flex-wrap gap-4 pt-2">
                        <div className="text-center">
                          <div className="text-white/90 font-semibold text-sm">1K+</div>
                          <div className="text-white/60 text-xs">Active Players</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white/90 font-semibold text-sm">2K+</div>
                          <div className="text-white/60 text-xs">Games Played</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white/90 font-semibold text-sm">24/7</div>
                          <div className="text-white/60 text-xs">Online Play</div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-3">
                      <h3 className="text-white/90 font-semibold text-xs uppercase tracking-wider">Quick Links</h3>
                      <nav className="flex flex-col space-y-0.5">
                        {quickLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <motion.button
                              key={link.path}
                              onClick={() => void navigate({ to: link.path })}
                              className="group flex items-center gap-2 px-2 py-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 text-xs text-left"
                              whileHover={{ x: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <Icon className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors flex-shrink-0" />
                              <span className="font-medium">{link.label}</span>
                            </motion.button>
                          );
                        })}
                      </nav>
                    </div>

                    {/* Support & Legal */}
                    <div className="space-y-3">
                      <h3 className="text-white/90 font-semibold text-xs uppercase tracking-wider">Support & Legal</h3>
                      <nav className="flex flex-col space-y-0.5">
                        {supportLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <motion.button
                              key={link.path}
                              onClick={() => void navigate({ to: link.path, search: link.search })}
                              className="group flex items-center gap-2 px-2 py-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 text-xs text-left"
                              whileHover={{ x: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <Icon className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors flex-shrink-0" />
                              <span className="font-medium">{link.label}</span>
                            </motion.button>
                          );
                        })}
                      </nav>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-white/60 text-xs sm:text-sm">
                        © 2025 Games of the Generals. All rights reserved.
                      </div>
                      <div className="flex items-center gap-4 text-white/50 text-xs">
                        <span>Made with ❤️ for strategy enthusiasts</span>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                          <span>All systems operational</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          {/* Collapsed Footer - Show minimal content */}
          {isFooterCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-center pt-2"
            >
              <div className="text-white/60 text-xs sm:text-sm">
                © 2025 Games of the Generals. All rights reserved.
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.footer>

      {/* Floating Global Chat Button - Desktop */}
      {isAuthenticated && !isBanned && (
        <motion.div
          initial={isMobile ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
          animate={isMobile ? { opacity: 1 } : { scale: 1, opacity: 1 }}
          transition={isMobile ? { delay: 0.6, duration: 0.2 } : { delay: 0.6, type: "spring", stiffness: 300, damping: 25 }}
          className="hidden lg:block fixed bottom-6 right-6 z-50"
        >
          <motion.div
            whileHover={isMobile ? undefined : { scale: 1.02 }}
            whileTap={isMobile ? undefined : { scale: 0.98 }}
            transition={isMobile ? { duration: 0.2 } : {
              scale: { type: "spring", stiffness: 400, damping: 25 }
            }}
          >
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setIsGlobalChatOpen(!isGlobalChatOpen)}
              className={cn(
                "backdrop-blur-lg border border-white/20 transition-all duration-300 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg hover:shadow-xl w-full h-full cursor-pointer",
                isGlobalChatOpen
                  ? "bg-white/15 hover:bg-white/20"
                  : "bg-black/50 hover:bg-black/60"
              )}
            >
              <motion.div
                animate={isMobile ? undefined : {
                  rotate: isGlobalChatOpen ? 180 : 0,
                  scale: isGlobalChatOpen ? 1.05 : 1
                }}
                transition={isMobile ? { duration: 0.2 } : {
                  rotate: { duration: 0.6, ease: "easeInOut" },
                  scale: { duration: 0.4 }
                }}
              >
                <MessageCircle className={cn(
                  "w-5 h-5 transition-colors duration-300",
                  isGlobalChatOpen ? "text-white" : "text-white/70"
                )} />
              </motion.div>
              <motion.span
                className="text-white/90 text-sm font-medium"
                animate={isMobile ? undefined : {
                  color: isGlobalChatOpen ? "#ffffff" : "rgba(255, 255, 255, 0.9)"
                }}
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
                      : "text-white/70 hover:text-white hover:bg-white/10"
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
              animate={isMobile ? undefined : {
                backgroundColor: isGlobalChatOpen ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.3)"
              }}
              transition={isMobile ? { duration: 0.2 } : {
                backgroundColor: { duration: 0.4 },
                scale: { type: "spring", stiffness: 400, damping: 25 }
              }}
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
                    : "text-white/70 hover:text-white"
                )}
              >
                <motion.div
                  animate={isMobile ? undefined : {
                    rotate: isGlobalChatOpen ? 180 : 0,
                    scale: isGlobalChatOpen ? 1.05 : 1
                  }}
                  transition={isMobile ? { duration: 0.2 } : {
                    rotate: { duration: 0.6, ease: "easeInOut" },
                    scale: { duration: 0.4 }
                  }}
                >
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                </motion.div>
                <motion.span
                  className="text-[10px] sm:text-xs text-white font-medium text-center leading-tight w-full"
                  animate={isMobile ? undefined : {
                    color: isGlobalChatOpen ? "#ffffff" : "rgba(255, 255, 255, 0.7)"
                  }}
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
              toast.success("Tutorial completed! Welcome to the battle, General!");
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
