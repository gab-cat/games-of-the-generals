"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Settings,
  X,
  Send,
  ChevronUp,
  ChevronDown,
  Loader2,
  ArrowDown,
} from "lucide-react";
import { useConvex, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";
import { ChatMessageGroup, type ChatLine, type ChatViewer } from "./ChatMessage";
import { groupChatMessages, newMessagesLabel } from "@/lib/chat-grouping";
import type { FunctionReturnType } from "convex/server";
import { OnlineUsersList } from "./OnlineUsersList";
import {
  ChatRulesModal,
  ChatSettingsModal,
  MentionNotification,
  RateLimitModal,
  SpamWarningModal,
} from ".";
import { MentionInputWithDropdown } from "./MentionInputWithDropdown";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useChatProtection } from "../../lib/useChatProtection";
import { useMobile } from "../../lib/useMobile";
import { useIP } from "../../lib/useIPStore";
import { useOnlineUsers } from "@/lib/useOnlineUsers";

type ServerMessage = FunctionReturnType<
  typeof api.globalChat.getMessages
>["messages"][number];

/** Within this many pixels of the bottom counts as "reading the latest". */
const STICK_TO_BOTTOM_PX = 150;
const LIVE_PAGE = 30;
const OLDER_PAGE = 30;

function toLine(msg: ServerMessage): ChatLine {
  return {
    key: msg._id,
    _id: msg._id,
    userId: msg.userId,
    username: msg.username,
    filteredMessage: msg.filteredMessage,
    timestamp: msg.timestamp,
    usernameColor: msg.usernameColor,
    adminRole: msg.adminRole,
    tier: "tier" in msg ? msg.tier : undefined,
    isDonor: "isDonor" in msg ? msg.isDonor : undefined,
    avatarUrl: "avatarUrl" in msg ? msg.avatarUrl : undefined,
    mentionedUsernames:
      "mentionedUsernames" in msg ? msg.mentionedUsernames : undefined,
  };
}

interface GlobalChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface OptimisticMessage {
  id: string;
  userId?: string; // Optional for system messages, use string for optimistic messages since we don't have the actual ID yet
  username: string;
  filteredMessage: string;
  timestamp: number;
  mentions?: Id<"users">[];
  usernameColor?: string;
  isOptimistic: true;
}

export function GlobalChatPanel({ isOpen, onToggle }: GlobalChatPanelProps) {
  const { isAuthenticated } = useConvexAuth();
  const isMobile = useMobile();
  const [message, setMessage] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [sendingCount, setSendingCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<
    OptimisticMessage[]
  >([]);
  const [clearedAt, setClearedAt] = useState<number | null>(null);
  const [commandResponse, setCommandResponse] = useState<string | null>(null);
  const [olderMessages, setOlderMessages] = useState<ServerMessage[]>([]);
  const [olderHasMore, setOlderHasMore] = useState<boolean | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const convex = useConvex();

  // Chat protection hook
  const {
    validateMessage,
    recordMessage,
    showRateLimitModal,
    showSpamModal,
    rateLimitState,
    spamMessage,
    spamType,
    closeRateLimitModal,
    closeSpamModal,
    setSpamType,
    setSpamMessage,
    setShowSpamModal,
  } = useChatProtection() as {
    validateMessage: (message: string) => Promise<{
      allowed: boolean;
      type?: "rateLimit" | "spam";
      reason?: string;
    }>;
    recordMessage: (message: string) => void;
    showRateLimitModal: boolean;
    showSpamModal: boolean;
    rateLimitState: {
      messageCount: number;
      isLimited: boolean;
      remainingTime: number;
    };
    spamMessage: string;
    spamType: "repeated" | "caps" | "excessive" | "profanity" | "generic";
    closeRateLimitModal: () => void;
    closeSpamModal: () => void;
    setSpamType: (
      type: "repeated" | "caps" | "excessive" | "profanity" | "generic",
    ) => void;
    setSpamMessage: (message: string) => void;
    setShowSpamModal: (show: boolean) => void;
  };

  // Current user profile - profile data changes infrequently
  const { data: currentUser } = useConvexQueryWithOptions(
    api.profiles.getCurrentProfile,
    {},
    {
      staleTime: 120000, // 2 minutes - profile data changes infrequently
      gcTime: 600000, // 10 minutes cache
    },
  );

  // IP address hook - fetches and stores IP once per session
  const { ipAddress } = useIP();

  // Queries - chat settings change infrequently
  const { data: chatSettings } = useConvexQueryWithOptions(
    api.globalChat.getUserChatSettings,
    {},
    {
      staleTime: 300000, // 5 minutes - chat settings don't change often
      gcTime: 600000, // 10 minutes cache
    },
  );

  const { data: messagesData } = useConvexQueryWithOptions(
    api.globalChat.getMessages,
    isOpen ? { limit: LIVE_PAGE } : "skip",
    {
      enabled: !!isOpen,
      staleTime: 30000, // 30 seconds - chat messages need moderate freshness
      gcTime: 300000, // 5 minutes cache
    },
  );

  // Who is reading: asked once here, not once per message row
  const { data: isCurrentUserAdmin = false } = useConvexQueryWithOptions(
    api.globalChat.isUserAdmin,
    isAuthenticated && isOpen ? {} : "skip",
    { staleTime: 300000, gcTime: 600000 },
  );
  const { data: isCurrentUserBanned = false } = useConvexQueryWithOptions(
    api.globalChat.isUserBanned,
    isAuthenticated && isOpen ? {} : "skip",
    { staleTime: 30000, gcTime: 60000 },
  );

  // Fetch online users with profile data
  const { onlineUsers } = useOnlineUsers(isOpen);

  const { data: unreadMentionCount = 0 } = useConvexQueryWithOptions(
    api.globalChat.getUnreadMentionCount,
    isAuthenticated ? {} : "skip",
    {
      enabled: !!isAuthenticated,
      staleTime: 10000, // 10 seconds - unread count should be fresh
      gcTime: 60000, // 1 minute cache
    },
  );

  // Mutations
  const sendMessage = useMutation(api.globalChat.sendMessage);
  const markMentionsAsRead = useMutation(api.globalChat.markMentionsAsRead);
  const agreeToRules = useMutation(api.globalChat.agreeToChatRules);

  // Oldest first: older pages, then the live page, then messages still sending
  const lines = useMemo<ChatLine[]>(() => {
    const live = [...(messagesData?.messages ?? [])].reverse();
    const seen = new Set<string>();
    const all: ChatLine[] = [];
    for (const msg of [...olderMessages, ...live]) {
      if (seen.has(msg._id)) continue;
      seen.add(msg._id);
      if (clearedAt !== null && msg.timestamp <= clearedAt) continue;
      all.push(toLine(msg));
    }
    for (const msg of optimisticMessages) {
      all.push({
        key: msg.id,
        userId: msg.userId,
        username: msg.username,
        filteredMessage: msg.filteredMessage,
        timestamp: msg.timestamp,
        usernameColor: msg.usernameColor,
        avatarUrl: currentUser?.avatarUrl,
        tier: undefined,
        isOptimistic: true,
      });
    }
    return all;
  }, [messagesData, olderMessages, optimisticMessages, clearedAt, currentUser]);

  const items = useMemo(() => groupChatMessages(lines), [lines]);
  const hasMoreOlder =
    clearedAt === null &&
    (olderHasMore ?? messagesData?.hasMore ?? false);

  const viewer: ChatViewer = {
    userId: currentUser?.userId,
    username: currentUser?.username,
    isAdmin: isCurrentUserAdmin,
    isBanned: isCurrentUserBanned,
    showTimestamps: chatSettings?.showTimestamps !== false,
  };

  const listHidden = isMinimized || (showUsers && isMobile);

  // Scrolling: follow new messages only while the reader is at the bottom.
  // Someone reading older messages keeps their place and gets a button instead.
  const atBottomRef = useRef(true);
  const forceScrollRef = useRef(false);
  const hydratedRef = useRef(false);
  const lastLineKeyRef = useRef<string | null>(null);
  const prependAnchorRef = useRef<{ height: number; top: number } | null>(
    null,
  );

  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    atBottomRef.current = true;
    setIsAwayFromBottom(false);
    setUnseenCount(0);
  }, []);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const away =
      el.scrollHeight - el.scrollTop - el.clientHeight > STICK_TO_BOTTOM_PX;
    atBottomRef.current = !away;
    setIsAwayFromBottom(away);
    if (!away) setUnseenCount(0);
  };

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || !isOpen || listHidden) return;

    // Older page added above: keep the same message under the reader's eyes
    const anchor = prependAnchorRef.current;
    if (anchor) {
      el.scrollTop = anchor.top + (el.scrollHeight - anchor.height);
      prependAnchorRef.current = null;
      return;
    }

    const last = lines[lines.length - 1];
    const lastKey = last?.key ?? null;
    if (lastKey === lastLineKeyRef.current) return;
    const previousKey = lastLineKeyRef.current;
    lastLineKeyRef.current = lastKey;

    if (!hydratedRef.current) {
      if (lines.length > 0) {
        scrollToBottom(false);
        hydratedRef.current = true;
      }
      return;
    }

    if (forceScrollRef.current || atBottomRef.current) {
      forceScrollRef.current = false;
      scrollToBottom(true);
      return;
    }

    // Count what arrived from other players since the reader scrolled up
    const previousIndex = lines.findIndex((l) => l.key === previousKey);
    const arrived = lines
      .slice(previousIndex + 1)
      .filter((l) => !l.isOptimistic && l.userId !== currentUser?.userId);
    if (arrived.length > 0) setUnseenCount((c) => c + arrived.length);
  }, [lines, isOpen, listHidden, scrollToBottom, currentUser?.userId]);

  // The list unmounts while minimized or showing players on a phone; land at
  // the bottom again when it comes back
  useEffect(() => {
    if (listHidden) {
      hydratedRef.current = false;
      lastLineKeyRef.current = null;
      atBottomRef.current = true;
      setUnseenCount(0);
      setIsAwayFromBottom(false);
    }
  }, [listHidden]);

  // Start fresh each time the panel opens
  useEffect(() => {
    if (!isOpen) {
      hydratedRef.current = false;
      lastLineKeyRef.current = null;
      atBottomRef.current = true;
      setUnseenCount(0);
      setIsAwayFromBottom(false);
      setOlderMessages([]);
      setOlderHasMore(null);
    }
  }, [isOpen]);

  const loadOlder = async () => {
    const oldest = lines.find((l) => !l.isOptimistic);
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await convex.query(api.globalChat.getMessages, {
        limit: OLDER_PAGE,
        beforeTimestamp: oldest.timestamp,
      });
      const el = scrollerRef.current;
      if (el) {
        prependAnchorRef.current = {
          height: el.scrollHeight,
          top: el.scrollTop,
        };
      }
      setOlderMessages((prev) => [...[...page.messages].reverse(), ...prev]);
      setOlderHasMore(page.hasMore);
    } catch {
      toast.error("Couldn't load older messages. Try again.");
    } finally {
      setLoadingOlder(false);
    }
  };

  // Mark mentions as read when panel opens
  useEffect(() => {
    if (isOpen && unreadMentionCount > 0) {
      void markMentionsAsRead();
    }
  }, [isOpen, unreadMentionCount, markMentionsAsRead]);

  // Focus input when panel opens
  useEffect(() => {
    // Skip on phones: focusing would pop the keyboard over the messages.
    if (isOpen && !isMinimized && !isMobile && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized, isMobile]);

  // Esc closes the panel, unless a dialog, menu or suggestion list is handling it
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (
        document.querySelector(
          '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]',
        )
      )
        return;
      onToggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onToggle]);

  const handleSendMessage = async () => {
    if (!message.trim() || !isAuthenticated || !currentUser) return;

    const messageText = message.trim();
    // Handle /clear command client-side
    if (messageText.toLowerCase() === "/clear") {
      // Hide everything sent so far, on this device only
      setClearedAt(Date.now());
      setOlderMessages([]);
      setMessage("");
      setCommandResponse("*Chat cleared on this device only.*");
      return;
    }

    // Validate message with rate limiting and spam filtering
    const validation = await validateMessage(messageText);

    if (!validation.allowed) {
      return; // Modal will be shown by the hook
    }

    // Create optimistic message
    const optimisticMessage: OptimisticMessage = {
      id: `optimistic-${Date.now()}-${Math.random()}`,
      userId: currentUser.userId || "temp-user-id", // Use userId from profile, fallback to temp
      username: currentUser.username || "You",
      filteredMessage: messageText, // Will be filtered by server
      timestamp: Date.now(),
      usernameColor: chatSettings?.usernameColor,
      isOptimistic: true,
    };

    // Add optimistic message immediately, and always show your own message
    forceScrollRef.current = true;
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);
    setMessage("");
    setSendingCount((c) => c + 1);

    let result: Awaited<ReturnType<typeof sendMessage>>;
    try {
      result = await sendMessage({
        message: messageText,
        ipAddress: ipAddress || undefined,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setOptimisticMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticMessage.id),
      );
      setMessage(messageText); // Give the text back so nothing is lost
      toast.error(
        "Couldn't send your message. Check your connection and try again.",
      );
      return;
    } finally {
      setSendingCount((c) => Math.max(0, c - 1));
    }

    if (result.success) {
      // Record successful message for rate limiting and spam detection
      recordMessage(messageText);

      // Remove optimistic message after successful send
      setOptimisticMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticMessage.id),
      );

      // Handle command responses
      if (
        "isSystemMessage" in result &&
        result.isSystemMessage &&
        "commandResponse" in result
      ) {
        // Show command response above the input (replaces any previous response)
        setCommandResponse(result.commandResponse ?? null);
      }
    } else {
      // Message failed to send
      const errorMessage =
        "message" in result ? result.message : "Failed to send message";
      console.error("Failed to send message:", errorMessage);

      // Remove optimistic message on error
      setOptimisticMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticMessage.id),
      );

      // Check if this is a repeated message error - show modal instead of toast
      if (
        errorMessage &&
        (errorMessage.includes("repeatedly") ||
          errorMessage.includes("same message"))
      ) {
        setSpamType("repeated");
        setSpamMessage(messageText);
        setShowSpamModal(true);
      } else {
        // Show error message for other failures
        toast.error(errorMessage || "Couldn't send your message. Try again.");
      }
    }
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleShowRules = () => {
    setShowRules(true);
  };

  const handleShowSettings = () => {
    setShowSettings(true);
  };

  if (!isAuthenticated) {
    return null;
  }

  // Check if user has agreed to rules
  const hasAgreedToRules = chatSettings?.rulesAgreedAt != null;

  const isLoadingMessages = messagesData === undefined;
  const panelHeight = "lg:h-[min(40rem,calc(100dvh-9rem))]";

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="global-chat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] top-14 z-[60] sm:top-16 lg:inset-x-auto lg:bottom-[4.75rem] lg:right-6 lg:top-auto lg:flex lg:items-end lg:gap-2"
          >
            {/* Online players: beside the panel on desktop */}
            <AnimatePresence>
              {showUsers && !isMinimized && !isMobile && (
                <div className={cn("hidden lg:block", panelHeight)}>
                  <OnlineUsersList
                    users={onlineUsers}
                    onClose={() => setShowUsers(false)}
                  />
                </div>
              )}
            </AnimatePresence>

            <section
              aria-label="Global chat"
              className={cn(
                "flex h-full flex-col overflow-hidden border-t border-border bg-card lg:w-[24rem] lg:rounded-lg lg:border lg:border-border-strong lg:shadow-lg",
                isMinimized && !isMobile ? "lg:h-12" : panelHeight,
              )}
            >
              {/* Header */}
              <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border pl-4 pr-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    Global chat
                  </h2>
                  {unreadMentionCount > 0 && (
                    <span
                      className="rounded bg-primary px-1.5 text-[11px] font-semibold leading-5 tabular-nums text-primary-foreground"
                      aria-label={`${unreadMentionCount} unread mentions`}
                    >
                      {unreadMentionCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    onClick={() => setShowUsers(!showUsers)}
                    aria-pressed={showUsers}
                    aria-label="Online players"
                    className={cn(
                      "h-9 gap-1.5 px-2.5",
                      showUsers && "bg-white/[0.08]",
                    )}
                  >
                    <Users />
                    {onlineUsers && (
                      <span className="text-xs">
                        {onlineUsers.length} online
                      </span>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShowSettings}
                    aria-label="Chat settings"
                    className="h-9 w-9"
                  >
                    <Settings />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleMinimize}
                    aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
                    className="hidden h-9 w-9 lg:inline-flex"
                  >
                    {isMinimized ? <ChevronUp /> : <ChevronDown />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    aria-label="Close chat"
                    className="h-9 w-9"
                  >
                    <X />
                  </Button>
                </div>
              </div>

              {(!isMinimized || isMobile) && (
                <div className="flex min-h-0 flex-1 flex-col">
                  {/* Online players replace the messages on phones */}
                  {showUsers && isMobile ? (
                    <div className="min-h-0 flex-1">
                      <OnlineUsersList
                        embedded
                        users={onlineUsers}
                        onClose={() => setShowUsers(false)}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Messages */}
                      <div className="relative flex min-h-0 flex-1 flex-col">
                        <div
                          ref={scrollerRef}
                          onScroll={handleScroll}
                          role="log"
                          aria-label="Global chat messages"
                          className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
                        >
                          <div className="flex min-h-full flex-col justify-end pb-2">
                            {isLoadingMessages ? (
                              <div aria-hidden="true" className="pt-1">
                                {[2, 1, 3, 1, 2].map((n, i) => (
                                  <div key={i} className="flex gap-2.5 px-3 pb-1 pt-2.5">
                                    <Skeleton className="mt-0.5 size-8 shrink-0 rounded-full" />
                                    <div className="flex-1 space-y-2 pt-1">
                                      <Skeleton className="h-3.5 w-28" />
                                      {Array.from({ length: n }).map((_, j) => (
                                        <Skeleton
                                          key={j}
                                          className={cn(
                                            "h-3.5",
                                            (i + j) % 3 === 0
                                              ? "w-4/5"
                                              : (i + j) % 3 === 1
                                                ? "w-3/5"
                                                : "w-11/12",
                                          )}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : items.length === 0 ? (
                              <div className="px-6 py-10 text-center">
                                <p className="text-sm font-medium text-foreground">
                                  {clearedAt !== null
                                    ? "Chat cleared on this device"
                                    : "No messages yet"}
                                </p>
                                <p className="mt-1 text-sm text-foreground/80">
                                  {clearedAt !== null
                                    ? "New messages show up here."
                                    : "Say hello to everyone online."}
                                </p>
                              </div>
                            ) : (
                              <>
                                {hasMoreOlder && (
                                  <div className="flex justify-center px-3 pb-1 pt-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => void loadOlder()}
                                      disabled={loadingOlder}
                                      className="h-8 gap-1.5 text-xs text-foreground/80"
                                    >
                                      {loadingOlder && (
                                        <Loader2 className="animate-spin" />
                                      )}
                                      {loadingOlder
                                        ? "Loading"
                                        : "Show older messages"}
                                    </Button>
                                  </div>
                                )}
                                {items.map((item) =>
                                  item.kind === "day" ? (
                                    <div
                                      key={item.key}
                                      role="separator"
                                      className="flex items-center gap-3 px-3 pb-1 pt-4"
                                    >
                                      <span className="h-px flex-1 bg-border" />
                                      <span className="text-xs font-medium text-foreground/70">
                                        {item.label}
                                      </span>
                                      <span className="h-px flex-1 bg-border" />
                                    </div>
                                  ) : (
                                    <ChatMessageGroup
                                      key={item.key}
                                      messages={item.messages}
                                      viewer={viewer}
                                      animate={hydratedRef.current}
                                    />
                                  ),
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Back to the latest, when reading older messages */}
                        <AnimatePresence>
                          {isAwayFromBottom && (
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 6 }}
                              transition={{ duration: 0.18 }}
                              className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center"
                            >
                              <Button
                                variant={unseenCount > 0 ? "default" : "secondary"}
                                size="sm"
                                onClick={() => scrollToBottom(true)}
                                className={cn(
                                  "pointer-events-auto h-8 gap-1.5 border-border-strong px-3 text-xs shadow-md",
                                  unseenCount === 0 &&
                                    "bg-raised hover:bg-raised hover:brightness-125",
                                )}
                              >
                                <ArrowDown />
                                {unseenCount > 0
                                  ? newMessagesLabel(unseenCount)
                                  : "Latest messages"}
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Command response */}
                      {commandResponse && (
                        <div className="shrink-0 border-t border-border bg-white/[0.03]">
                          <div className="flex items-start justify-between gap-2 py-2 pl-4 pr-2">
                            <div className="no-scrollbar max-h-32 min-w-0 flex-1 overflow-y-auto text-sm text-foreground">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => (
                                    <p className="mb-2 leading-relaxed last:mb-0">
                                      {children}
                                    </p>
                                  ),
                                  strong: ({ children }) => (
                                    <span className="font-semibold">
                                      {children}
                                    </span>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="mb-2 list-inside list-disc space-y-1">
                                      {children}
                                    </ul>
                                  ),
                                  li: ({ children }) => (
                                    <li className="text-foreground/90">
                                      {children}
                                    </li>
                                  ),
                                  code: ({ children }) => (
                                    <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                                      {children}
                                    </code>
                                  ),
                                  h1: ({ children }) => (
                                    <h1 className="mb-2 text-base font-semibold">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="mb-2 text-sm font-semibold">
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="mb-1 text-sm font-semibold">
                                      {children}
                                    </h3>
                                  ),
                                }}
                              >
                                {commandResponse}
                              </ReactMarkdown>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCommandResponse(null)}
                              aria-label="Dismiss"
                              className="h-9 w-9 shrink-0"
                            >
                              <X />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Input */}
                      <div className="shrink-0 border-t border-border p-3">
                        {!hasAgreedToRules ? (
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-foreground">
                              Accept the chat rules to send messages.
                            </p>
                            <Button
                              onClick={handleShowRules}
                              variant="secondary"
                              className="shrink-0"
                            >
                              Read the rules
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <MentionInputWithDropdown
                                handleSendMessage={() =>
                                  void handleSendMessage()
                                }
                                ref={inputRef}
                                value={message}
                                onChange={setMessage}
                                placeholder="Write a message. Type @ to mention."
                                aria-label="Message"
                                maxLength={500}
                                onlineUsers={onlineUsers}
                              />
                              <Button
                                onClick={() => void handleSendMessage()}
                                disabled={
                                  !message.trim() || rateLimitState.isLimited
                                }
                                size="icon"
                                aria-label="Send message"
                                className="shrink-0"
                              >
                                {sendingCount > 0 ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <Send />
                                )}
                              </Button>
                            </div>
                            {message.length > 400 && (
                              <p className="mt-1.5 text-right text-xs tabular-nums text-foreground/70">
                                {message.length}/500
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ChatRulesModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        onAgree={() => {
          void (async () => {
            try {
              await agreeToRules({});
              setShowRules(false);
              toast.success("Rules accepted. You can now post in chat.");
            } catch {
              toast.error("Couldn't save your answer. Try again.");
            }
          })();
        }}
      />

      <ChatSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentSettings={chatSettings}
      />

      <RateLimitModal
        isOpen={showRateLimitModal}
        onClose={closeRateLimitModal}
        remainingTime={rateLimitState.remainingTime}
      />

      <SpamWarningModal
        isOpen={showSpamModal}
        onClose={closeSpamModal}
        spamType={spamType}
        message={spamMessage}
      />

      {/* Mention Notifications */}
      <MentionNotification />
    </>
  );
}
