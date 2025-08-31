"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { User, LogOut, Trophy, Settings, Gamepad2, ChevronDown, History, Bot, MessageCircle } from "lucide-react";
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
import { TutorialModal } from "./TutorialModal";
import { BanScreen } from "./BanScreen";
import { cn } from "../lib/utils";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import { useOnlineStatus } from "../lib/useOnlineStatus";
import { useMobile } from "../lib/useMobile";
import { MessageNotification } from "./messaging/MessageNotification";
import { useQuery } from "convex-helpers/react/cache";

// Lazy load components
const GlobalChatPanel = lazy(() => import("./global-chat/GlobalChatPanel").then(module => ({ default: module.GlobalChatPanel })));
const MessagingPanel = lazy(() => import("./messaging/MessagingPanel").then(module => ({ default: module.MessagingPanel })));
const MessageButton = lazy(() => import("./messaging/MessageButton").then(module => ({ default: module.MessageButton })));


interface LayoutProps {
  children: React.ReactNode;
  user?: {
    username: string;
  } | null;
  onOpenMessagingWithLobby?: (handler: (lobbyId: Id<"lobbies">) => void) => void;
}

export function Layout({ children, user, onOpenMessagingWithLobby }: LayoutProps) {
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
  const isMobile = useMobile();

  const markTutorialCompleted = useMutation(api.profiles.markTutorialCompleted);

  // Profile data doesn't change frequently, cache it for longer
  const { data: profile } = useConvexQueryWithOptions(
    api.profiles.getCurrentProfile,
    {},
    {
      staleTime: 120000, // 2 minutes - profile data changes infrequently
      gcTime: 600000, // 10 minutes cache
    }
  );

  // Online status tracking - pass profile data to avoid querying it in the hook
  const { markUserOffline } = useOnlineStatus({
    currentPage: location.pathname,
    userId: profile?.userId,
    username: profile?.username,
  });

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
      path: "/match-history",
      label: "Match History",
      icon: History
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 pb-16 px-2 lg:pb-0 no-scrollbar">
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
              onClick={() => void navigate({ to: "/" })}
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
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-white/50 text-xs">Online</span>
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
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          <span className="text-white/60 text-xs">Online</span>
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
                      onClick={() => void navigate({ to: "/settings" })}
                      className="flex items-center gap-3 text-white/90 hover:bg-white/10 mx-1 rounded-md cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="bg-white/10" />

                  <div className="py-1">
                    <DropdownMenuItem
                      onClick={() => {
                        // Mark user as offline before signing out
                        void markUserOffline().catch((error) => {
                          console.error("Failed to mark user offline:", error);
                        });
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
      <main className="flex-1 max-w-7xl mx-auto mt-4 sm:mt-8 px-3 sm:px-6">
        {isAuthenticated && isBanned ? <BanScreen /> : children}
      </main>

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
              className="flex-1 max-w-20 sm:max-w-24 rounded-full"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsGlobalChatOpen(!isGlobalChatOpen)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 py-5 transition-all duration-200 min-w-0 w-full h-full cursor-pointer",
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
    </div>
  );
}
