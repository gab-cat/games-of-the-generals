"use client";

import { motion } from "framer-motion";
import { User, LogOut, Trophy, Settings, Gamepad2, ChevronDown, History, Bot } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useConvexQuery } from "../lib/convex-query-hooks";
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
import { MessageButton } from "./messaging/MessageButton";
import { MessagingPanel } from "./messaging/MessagingPanel";
import { MessageNotification } from "./messaging/MessageNotification";
import { TutorialButton } from "./TutorialButton";
import { TutorialModal } from "./TutorialModal";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

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

  const markTutorialCompleted = useMutation(api.profiles.markTutorialCompleted);

  // Check tutorial status
  const { data: tutorialStatus } = useConvexQuery(
    api.profiles.checkTutorialStatus,
    isAuthenticated ? {} : "skip"
  );

  // Expose function to open messaging with lobby invite
  useEffect(() => {
    if (onOpenMessagingWithLobby) {
      onOpenMessagingWithLobby((lobbyId: Id<"lobbies">) => {
        setInviteLobbyId(lobbyId);
        setIsMessagingOpen(true);
      });
    }
  }, [onOpenMessagingWithLobby]);

  // Check if tutorial should be shown on first login
  useEffect(() => {
    if (tutorialStatus && !hasCheckedTutorial && isAuthenticated) {
      if (tutorialStatus.isFirstLogin && !tutorialStatus.hasSeenTutorial) {
        setShowTutorial(true);
      }
      setHasCheckedTutorial(true);
    }
  }, [tutorialStatus, hasCheckedTutorial, isAuthenticated]);
  
  const { data: profile, error: profileError } = useConvexQuery(
    api.profiles.getCurrentProfile
  );

  const { data: unreadCount = 0 } = useConvexQuery(
    api.messages.getUnreadCount,
    isAuthenticated ? {} : "skip"
  );

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
    if (profileError) {
      console.error("Error loading profile:", profileError);
    }
  }, [profileError]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 pb-16 lg:pb-0">
      {/* Minimalist Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          isScrolled 
            ? "bg-black/50 backdrop-blur-sm border-b border-white/20" 
            : "bg-black/40 backdrop-blur-sm border-b border-white/10"
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
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center group cursor-pointer hover:bg-white/20 transition-all duration-200 flex-shrink-0"
            >
              <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 group-hover:text-white transition-colors" />
            </motion.div>
            
            {/* Clean Title */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col cursor-pointer min-w-0"
              onClick={() => void navigate({ to: "/" })}
            >
              <h1 className="text-base sm:text-xl font-display font-semibold text-white/95 tracking-tight hover:text-white transition-colors truncate">
                <span className="hidden sm:inline">Games of the Generals</span>
                <span className="sm:hidden">GoG</span>
              </h1>
              <div className="w-full h-px bg-white/20 mt-1"></div>
            </motion.div>
          </motion.div>

          {/* Middle Section - Navigation */}
          {isAuthenticated && (
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
          {isAuthenticated && user && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 flex justify-end items-center gap-2 sm:gap-3 min-w-0"
            >
              {/* Tutorial Button */}
              <TutorialButton variant="icon" size="md" />

              {/* Message Button */}
              <MessageButton
                unreadCount={unreadCount}
                isActive={isMessagingOpen}
                onClick={() => setIsMessagingOpen(!isMessagingOpen)}
              />

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
                      onClick={() => void signOut()}
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
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto mt-4 sm:mt-8 px-3 sm:px-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {isAuthenticated && (
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
          </div>
        </motion.nav>
      )}

      {/* Messaging Panel */}
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
