"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import {
  User,
  LogOut,
  Award,
  Trophy,
  Settings,
  Swords,
  ChevronDown,
  History,
  Bot,
  MessageCircle,
  Shield,
  Newspaper,
  LifeBuoy,
  Volume2,
  CreditCard,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";
import { GlobalPresenceHeartbeat } from "../lib/useOnlineUsers";
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
import { BrandLockup } from "./BrandMark";
import { TutorialModal } from "./TutorialModal";
import { BanScreen } from "./BanScreen";
import { SeasonUpdateModal } from "./modals/SeasonUpdateModal";
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
import { MessageNotification } from "./messaging/MessageNotification";
import { useQuery } from "convex-helpers/react/cache";
import { useSound } from "../lib/SoundProvider";
import { SiteFooter } from "./SiteFooter";
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
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [inviteLobbyId, setInviteLobbyId] = useState<Id<"lobbies"> | null>(
    null,
  );

  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCheckedTutorial, setHasCheckedTutorial] = useState(false);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const { playBGM, stopBGM } = useSound();

  const markTutorialCompleted = useMutation(api.profiles.markTutorialCompleted);

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

  // Show the tutorial once on first sign-in, but only after a username exists,
  // so it never covers the "Choose a username" form.
  useEffect(() => {
    if (tutorialStatus && !hasCheckedTutorial && isAuthenticated && user) {
      if (tutorialStatus.isFirstLogin && !tutorialStatus.hasSeenTutorial) {
        setShowTutorial(true);
      }
      setHasCheckedTutorial(true);
    }
  }, [tutorialStatus, hasCheckedTutorial, isAuthenticated, user]);

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
      icon: Swords,
    },
    {
      path: "/ai-game",
      label: "Vs AI",
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
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
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

  const status = deriveStatus({
    username: user?.username ?? "",
    gameId: profile?.gameId,
    lobbyId: profile?.lobbyId,
    aiGameId: profile?.aiSessionId,
  });
  const statusText = getStatusText(status) ?? "Online";
  const statusNode = getStatusIndicatorNode(status);
  const tier = profile?.tier as "free" | "pro" | "pro_plus" | undefined;
  // Nav and chat wait for a username; before that the only job is choosing one.
  const showAppChrome = isAuthenticated && !isBanned && !!user;

  const menuItemClass =
    "flex cursor-pointer items-center gap-2.5 rounded px-2 py-2 text-sm text-foreground focus:bg-white/[0.08] [&_svg]:size-4 [&_svg]:text-foreground/70";

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col bg-background",
        // Room for the phone tab bar, which only shows when signed in
        showAppChrome && "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0",
      )}
    >
      {/* Quiet backdrop: a faint grid that fades out under the header */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 select-none"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_45%_at_50%_0%,#000_60%,transparent_100%)]" />
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(217,164,65,0.06),transparent)]" />
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-colors duration-200",
          isScrolled
            ? "border-border bg-background/90 backdrop-blur-md"
            : "border-transparent bg-background/60 backdrop-blur-sm",
        )}
      >
        <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link
            to="/"
            search={{ lobbyId: undefined }}
            aria-label="Games of the Generals, home"
            className="group -mx-1.5 flex min-w-0 items-center rounded-md px-1.5 py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          >
            <BrandLockup compact={showAppChrome} />
          </Link>

          {showAppChrome && (
            <nav
              aria-label="Main"
              className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex"
            >
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveTab(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                      active
                        ? "text-foreground"
                        : "text-foreground/65 hover:bg-white/[0.04] hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        active ? "text-gold-400" : "text-current",
                      )}
                    />
                    {item.label}
                    {item.path === "/announcements" && !hasSeenLatest && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-gold-400"
                        aria-label="New post"
                      />
                    )}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 -z-10 rounded-md bg-white/[0.07]"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {showAppChrome && user && (
            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <TutorialButton onOpen={() => setShowTutorial(true)} />
              <Suspense fallback={<div className="h-9 w-9" />}>
                <MessageButton
                  unreadCount={unreadCount}
                  isActive={isMessagingOpen}
                  onClick={() => setIsMessagingOpen(!isMessagingOpen)}
                />
              </Suspense>

              <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Account menu"
                    className="group flex h-9 min-w-0 items-center gap-2 rounded-md pl-1 pr-1.5 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 data-[state=open]:bg-white/[0.08] sm:pl-1.5 sm:pr-2"
                  >
                    <UserAvatar
                      username={user.username}
                      avatarUrl={profile?.avatarUrl}
                      rank={profile?.rank}
                      size="xs"
                      frame={profile?.avatarFrame}
                      className="h-7 w-7 shrink-0"
                    />
                    <span className="hidden max-w-[140px] truncate sm:block">
                      <UserNameWithBadge
                        username={user.username}
                        tier={tier}
                        isDonor={profile?.isDonor}
                        usernameColor={profile?.usernameColor}
                        size="xs"
                      />
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground/60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-64 p-1.5"
                >
                  <div className="flex items-center gap-3 px-2 pb-3 pt-2">
                    <UserAvatar
                      username={user.username}
                      avatarUrl={profile?.avatarUrl}
                      rank={profile?.rank}
                      size="md"
                      frame={profile?.avatarFrame}
                    />
                    <div className="min-w-0">
                      <UserNameWithBadge
                        username={user.username}
                        tier={tier}
                        isDonor={profile?.isDonor}
                        usernameColor={profile?.usernameColor}
                        size="sm"
                      />
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-foreground/75">
                        {statusNode ? (
                          <span className="flex scale-75 items-center">
                            {statusNode}
                          </span>
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                        <span
                          className={cn(
                            "truncate",
                            getStatusColorClass(status),
                          )}
                        >
                          {statusText}
                        </span>
                        {profile?.rank && (
                          <>
                            <span className="text-foreground/30">·</span>
                            <span className="truncate text-gold-300">
                              {profile.rank}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className={menuItemClass}>
                    <Link to="/profile">
                      <User /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className={menuItemClass}>
                    <Link to="/achievements">
                      <Award /> Achievements
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className={menuItemClass}>
                    <Link to="/match-history">
                      <History /> Match history
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className={menuItemClass}>
                    <Link
                      to="/subscription"
                      search={{ subscription: undefined }}
                    >
                      <CreditCard /> Subscription
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setIsSoundSettingsOpen(true)}
                    className={menuItemClass}
                  >
                    <Volume2 /> Sound
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className={menuItemClass}>
                    <Link to="/settings">
                      <Settings /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className={menuItemClass}>
                    <Link to="/support" search={{ ticketId: undefined }}>
                      <LifeBuoy /> Support
                    </Link>
                  </DropdownMenuItem>
                  {profile?.adminRole && (
                    <DropdownMenuItem asChild className={menuItemClass}>
                      <Link to="/admin">
                        <Shield /> Admin
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      void signOut();
                    }}
                    className={cn(
                      menuItemClass,
                      "text-red-300 focus:bg-red-500/10 focus:text-red-200 [&_svg]:text-red-300",
                    )}
                  >
                    <LogOut /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {!isAuthenticated && (
            <nav
              aria-label="Legal"
              className="hidden shrink-0 items-center gap-1 sm:flex"
            >
              <Link
                to="/about"
                className="rounded-md px-3 py-2 text-sm text-foreground/75 transition-colors hover:bg-white/[0.04] hover:text-foreground"
              >
                About
              </Link>
              <Link
                to="/privacy"
                className="rounded-md px-3 py-2 text-sm text-foreground/75 transition-colors hover:bg-white/[0.04] hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="rounded-md px-3 py-2 text-sm text-foreground/75 transition-colors hover:bg-white/[0.04] hover:text-foreground"
              >
                Terms
              </Link>
            </nav>
          )}
        </div>
      </header>

      {showAppChrome && (
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
          <ExpiryWarningBanner />
        </div>
      )}

      <main
        className={cn(
          "relative z-10 w-full flex-1",
          // The signed-out home page is a full-bleed split; everything else sits in the column.
          !isAuthLoading && !isAuthenticated && location.pathname === "/"
            ? ""
            : "mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8",
          // Signed in, the page always fills the screen below the header, so the
          // footer stays below the fold and doesn't jump between short and long pages.
          (isAuthLoading || isAuthenticated) &&
            "min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)]",
        )}
      >
        {isAuthenticated && isBanned ? <BanScreen /> : children}
      </main>

      {/* No footer until auth resolves, so signed-in players never see the full one flash. */}
      {!isAuthLoading && (
        <SiteFooter variant={isAuthenticated ? "minimal" : "full"} />
      )}

      {/* Global chat: floating button on desktop, a tab on phones */}
      {showAppChrome && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.25 }}
          className="fixed bottom-6 right-6 z-50 hidden lg:block"
        >
          <Button
            variant="secondary"
            onClick={() => setIsGlobalChatOpen(!isGlobalChatOpen)}
            aria-pressed={isGlobalChatOpen}
            className={cn(
              "h-11 gap-2 rounded-lg border-border-strong bg-card px-4 hover:bg-raised",
              isGlobalChatOpen && "border-gold-500/40 bg-raised",
            )}
          >
            <MessageCircle className="text-gold-400" />
            Global chat
          </Button>
        </motion.div>
      )}

      {showAppChrome && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        >
          <div className="mx-auto flex h-16 max-w-lg items-stretch px-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveTab(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-[0.97]",
                    active ? "text-foreground" : "text-foreground/60",
                  )}
                >
                  <span className="relative">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        active ? "text-gold-400" : "text-current",
                      )}
                    />
                    {item.path === "/announcements" && !hasSeenLatest && (
                      <span className="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-gold-400" />
                    )}
                  </span>
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="tab-active"
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-gold-400"
                    />
                  )}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setIsGlobalChatOpen(!isGlobalChatOpen)}
              aria-pressed={isGlobalChatOpen}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-[0.97]",
                isGlobalChatOpen ? "text-foreground" : "text-foreground/60",
              )}
            >
              <MessageCircle
                className={cn(
                  "h-5 w-5",
                  isGlobalChatOpen ? "text-gold-400" : "text-current",
                )}
              />
              Chat
            </button>
          </div>
        </nav>
      )}

      {/* One global presence heartbeat per tab, whether or not a panel is open */}
      <GlobalPresenceHeartbeat />

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
        onClose={() => {
          // Closing counts as seen, so it never reopens by itself.
          setShowTutorial(false);
          if (!tutorialStatus?.hasSeenTutorial) {
            markTutorialCompleted().catch(() => {});
          }
        }}
        onComplete={() => {
          setShowTutorial(false);
          markTutorialCompleted()
            .then(() => toast.success("You're ready to play."))
            .catch(() => {});
        }}
      />

      {/* Sound Settings Dialog */}
      <Suspense fallback={null}>
        <SoundSettingsDialog
          isOpen={isSoundSettingsOpen}
          onClose={() => setIsSoundSettingsOpen(false)}
        />
      </Suspense>
      <SeasonUpdateModal />
    </div>
  );
}
