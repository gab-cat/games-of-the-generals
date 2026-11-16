import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Copy,
  Users,
  Eye,
  ArrowLeft,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useConvex, useMutation } from "convex/react";
import { useConvexQueryWithOptions } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { UserAvatar } from "../UserAvatar";
import { UserNameWithBadge } from "../UserNameWithBadge";
import { BrandMark } from "../BrandMark";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { useDebouncedCallback } from "use-debounce";
import { useOnlineUsers } from "../../lib/useOnlineUsers";
import { useChatProtection } from "../../lib/useChatProtection";
import { RateLimitModal, SpamWarningModal } from "../global-chat";

interface OptimisticMessage {
  _id: string;
  content: string;
  messageType: "text" | "lobby_invite" | "game_invite";
  senderId: string;
  senderUsername?: string;
  _creationTime: number;
  timestamp?: number;
  readAt?: number;
  deliveredAt?: number;
  lobbyId?: string;
  lobbyCode?: string;
  lobbyName?: string;
  gameId?: string;
  isOptimistic: true;
  status: "sending" | "failed";
}

interface ConversationViewProps {
  otherUserId: string;
  onNavigateToLobby?: (lobbyId: string) => void;
  onNavigateToGame?: (gameId: string) => void;
  onBack?: () => void;
  onNavigateToTicket?: (ticketId: string) => void;
}

interface Message {
  _id: string;
  senderId: string;
  senderUsername: string;
  recipientId: string;
  recipientUsername: string;
  content: string;
  messageType: "text" | "lobby_invite" | "game_invite";
  lobbyId?: string;
  lobbyCode?: string;
  lobbyName?: string;
  gameId?: string;
  timestamp: number;
  readAt?: number;
  deliveredAt?: number;
}

interface LobbyInviteMessageProps {
  message: Message | OptimisticMessage;
  onNavigateToLobby?: (lobbyId: string) => void;
  copyLobbyCode: (code: string) => void;
  currentUserId?: string;
  onJoinLobby?: (lobbyId: string) => Promise<void> | void;
}

function StatusDot({ className }: { className: string }) {
  return (
    <span
      className={cn("size-2 shrink-0 rounded-full", className)}
      aria-hidden="true"
    />
  );
}

function LobbyInviteMessage({
  message,
  onNavigateToLobby,
  copyLobbyCode,
  currentUserId,
  onJoinLobby,
}: LobbyInviteMessageProps) {
  const [isJoining, setIsJoining] = useState(false);
  const { data: lobbyInfo } = useConvexQuery(
    api.lobbies.getLobby,
    message.lobbyId ? { lobbyId: message.lobbyId as Id<"lobbies"> } : "skip",
  );

  const isOwnMessage = message.senderId === currentUserId;

  const handleJoin = async () => {
    if (!onJoinLobby || !message.lobbyId || isJoining) return;
    setIsJoining(true);
    try {
      await onJoinLobby(message.lobbyId);
    } finally {
      setIsJoining(false);
    }
  };

  const copyButton = message.lobbyCode ? (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => copyLobbyCode(message.lobbyCode!)}
    >
      <Copy />
      Copy code
    </Button>
  ) : null;

  return (
    <div className="w-full min-w-[220px] space-y-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Users className="size-4 shrink-0" />
          Lobby invite
        </p>
        {(message.lobbyName ?? lobbyInfo?.name) && (
          <p className="mt-0.5 truncate text-sm text-foreground/80">
            {message.lobbyName ?? lobbyInfo?.name}
          </p>
        )}
      </div>

      {lobbyInfo ? (
        <>
          <p className="flex items-center gap-2 text-sm text-foreground/90">
            {lobbyInfo.status === "waiting" ? (
              <>
                <StatusDot className="bg-emerald-400" />
                Open, {lobbyInfo.playerId ? "2" : "1"} of 2 players
              </>
            ) : lobbyInfo.status === "playing" ? (
              <>
                <StatusDot className="bg-gold-400" />
                Game in progress
              </>
            ) : (
              <>
                <StatusDot className="bg-foreground/40" />
                Game over
              </>
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            {!isOwnMessage &&
              message.lobbyId &&
              lobbyInfo.status === "waiting" &&
              onJoinLobby && (
                <Button
                  size="sm"
                  onClick={() => void handleJoin()}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Joining
                    </>
                  ) : (
                    "Join lobby"
                  )}
                </Button>
              )}
            {!isOwnMessage &&
              message.lobbyId &&
              onNavigateToLobby &&
              lobbyInfo.status === "playing" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onNavigateToLobby(message.lobbyId!)}
                >
                  <Eye />
                  Spectate
                </Button>
              )}
            {copyButton}
          </div>
        </>
      ) : message.lobbyId ? (
        <p className="flex items-center gap-2 text-sm text-foreground/80">
          <StatusDot className="bg-foreground/40" />
          This invite has expired.
        </p>
      ) : (
        copyButton && <div className="flex">{copyButton}</div>
      )}
    </div>
  );
}

export function ConversationView({
  otherUserId,
  onNavigateToLobby,
  onNavigateToGame,
  onBack,
  onNavigateToTicket,
}: ConversationViewProps) {
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<
    OptimisticMessage[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const newestTimestampRef = useRef<number>(0);

  // Online users presence data
  const { onlineUsers } = useOnlineUsers(true);

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

  // Helper: status dot and status text for the header
  const getHeaderStatus = (username?: string) => {
    const none = {
      indicator: null as React.ReactNode,
      text: null as string | null,
    };
    if (!username) return none;
    const user = onlineUsers?.find(
      (u: { username: string }) => u.username === username,
    );
    if (!user) return none;

    if (user.gameId) {
      return {
        indicator: <StatusDot className="size-2.5 bg-red-400" />,
        text: "In a game",
      };
    }
    if (user.lobbyId) {
      return {
        indicator: <StatusDot className="size-2.5 bg-gold-400" />,
        text: "In a lobby",
      };
    }
    if (user.aiGameId) {
      return {
        indicator: <StatusDot className="size-2.5 bg-gold-400" />,
        text: "Playing the AI",
      };
    }
    // Generally online
    return {
      indicator: <StatusDot className="size-2.5 bg-emerald-400" />,
      text: null,
    };
  };

  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);
  const joinLobby = useMutation(api.lobbies.joinLobby);
  const setTyping = useMutation(api.messages.setTyping);

  const convex = useConvex();
  // Load latest messages (single page)
  const { data: latestData, isLoading: messagesLoading } = useConvexQuery(
    api.messages.getConversationMessages,
    { otherUserId, paginationOpts: { numItems: 20 } },
  );
  const serverMessages = latestData?.page || [];
  // Manual pagination state for older messages
  const [olderMessages, setOlderMessages] = useState<Message[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = useState<boolean>(false);
  const [isFetchingOlder, setIsFetchingOlder] = useState<boolean>(false);

  // Merge older + server messages with optimistic messages
  const messages = [
    ...olderMessages,
    ...serverMessages,
    ...optimisticMessages,
  ].sort((a, b) => {
    const aTime = "timestamp" in a ? (a.timestamp ?? 0) : a._creationTime;
    const bTime = "timestamp" in b ? (b.timestamp ?? 0) : b._creationTime;
    return aTime - bTime;
  });

  const { data: otherUserProfile } = useConvexQuery(
    api.profiles.getProfileByUserId,
    { userId: otherUserId },
  );

  // Current user profile - profile data changes infrequently
  const { data: currentUserProfile } = useConvexQueryWithOptions(
    api.profiles.getCurrentProfile,
    {},
    {
      staleTime: 120000, // 2 minutes - profile data changes infrequently
      gcTime: 600000, // 10 minutes cache
    },
  );

  // Check if this is a system notification conversation (both participants are the same user)
  const isNotificationConversation = otherUserId === currentUserProfile?.userId;

  // Typing status of the other user
  const { data: typingStatus } = useConvexQuery(api.messages.getTypingStatus, {
    otherUserId,
  });

  // Local typing state and idle timeout with enhanced debouncing
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSignalRef = useRef<number>(0);
  // Prevent concurrent mark-as-read calls and reduce write conflicts
  const isMarkingReadRef = useRef(false);
  const lastMarkReadAtRef = useRef(0);

  // Auto-scroll to bottom when new messages arrive (but not when loading older pages)
  const loadingOlderRef = useRef(false);
  const loadOlderMessages = async () => {
    if (isFetchingOlder) return;
    // Compute earliest timestamp from currently loaded messages
    const allLoaded: Array<Message | OptimisticMessage> = [
      ...olderMessages,
      ...serverMessages,
    ];
    if (allLoaded.length === 0) return;
    const earliest = allLoaded.reduce((min, msg: any) => {
      const t = "timestamp" in msg ? msg.timestamp : msg._creationTime;
      return Math.min(min, t ?? Number.POSITIVE_INFINITY);
    }, Number.POSITIVE_INFINITY);
    if (!isFinite(earliest)) return;
    setIsFetchingOlder(true);
    loadingOlderRef.current = true;
    try {
      const resp: any = await convex.query(
        api.messages.getConversationMessages,
        {
          otherUserId: otherUserId as Id<"users">,
          beforeTimestamp: earliest,
          paginationOpts: { numItems: 20 },
        },
      );
      const newPage: Message[] = resp?.page ?? [];
      if (newPage.length > 0) {
        setOlderMessages((prev) => {
          const map = new Map<string, Message>();
          for (const m of [...prev, ...newPage]) map.set((m as any)._id, m);
          return Array.from(map.values());
        });
      }
      // Prefer server hasMore; fallback to isDone
      if (typeof resp?.hasMore === "boolean") {
        setHasMoreOlder(resp.hasMore);
      } else {
        setHasMoreOlder(!(resp?.isDone ?? true));
      }
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setIsFetchingOlder(false);
    }
  };
  useEffect(() => {
    // Determine newest message timestamp across loaded lists
    const newestTimestamp = messages.reduce((max, msg: any) => {
      const t = "timestamp" in msg ? msg.timestamp : msg._creationTime;
      return Math.max(max, t ?? 0);
    }, 0);

    const isNewer = newestTimestamp > (newestTimestampRef.current || 0);
    if (isNewer && !loadingOlderRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    newestTimestampRef.current = newestTimestamp;

    if (!isFetchingOlder) {
      loadingOlderRef.current = false;
    }
  }, [messages, isFetchingOlder]);

  // Reset manual pagination when switching conversations
  useEffect(() => {
    setOlderMessages([]);
    setHasMoreOlder(false);
    setIsFetchingOlder(false);
  }, [otherUserId]);

  // Determine if there are older messages after first load or when switching conversations
  useEffect(() => {
    if (!latestData) return;
    // Prefer server-provided hasMore when available; else fall back to isDone
    if (
      typeof latestData === "object" &&
      latestData !== null &&
      "hasMore" in latestData
    ) {
      const hasMore = (latestData as { hasMore?: boolean }).hasMore;
      if (typeof hasMore === "boolean") {
        setHasMoreOlder(hasMore);
        return;
      }
    }
    if (
      typeof latestData === "object" &&
      latestData !== null &&
      "isDone" in latestData
    ) {
      const isDone = (latestData as { isDone?: boolean }).isDone;
      setHasMoreOlder(Boolean(isDone === false));
      return;
    }
    // Fallback: if older shape ever returns an array, infer via page size
    if (Array.isArray(latestData)) {
      setHasMoreOlder((latestData as any[]).length >= 20);
    } else if (
      typeof latestData === "object" &&
      latestData !== null &&
      "page" in latestData
    ) {
      const page = (latestData as { page?: any[] }).page;
      setHasMoreOlder(Array.isArray(page) && page.length >= 20);
    }
  }, [otherUserId, latestData]);

  // Mark messages as read when there are unread incoming messages from the other user
  useEffect(() => {
    if (!currentUserProfile) return;

    const hasUnreadIncoming = messages.some((m) => {
      if ("isOptimistic" in m) return false;
      const msg = m as Message;

      // For notification conversations (self-conversations), mark any unread message as read
      if (isNotificationConversation) {
        return !msg.readAt;
      }

      // For regular conversations, only mark messages from the other user to current user
      return (
        msg.senderId === otherUserId &&
        msg.recipientId === currentUserProfile.userId &&
        !msg.readAt
      );
    });

    if (!hasUnreadIncoming) return;

    const now = Date.now();
    if (isMarkingReadRef.current) return;
    if (now - (lastMarkReadAtRef.current || 0) < 1000) return; // throttle to 1s

    isMarkingReadRef.current = true;
    lastMarkReadAtRef.current = now;
    markAsRead({ otherUserId: otherUserId as Id<"users"> })
      .catch(console.error)
      .finally(() => {
        isMarkingReadRef.current = false;
      });
  }, [
    messages,
    otherUserId,
    currentUserProfile,
    markAsRead,
    isNotificationConversation,
  ]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage.trim();

    // Validate message with rate limiting and spam filtering
    const validation = await validateMessage(messageText);

    if (!validation.allowed) {
      return; // Modal will be shown by the hook
    }

    // Use original message text (profanity validation already prevents sending inappropriate content)
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;

    // Create optimistic message
    const optimisticMessage: OptimisticMessage = {
      _id: optimisticId,
      content: messageText,
      messageType: "text",
      senderId: currentUserProfile?.userId || "",
      _creationTime: Date.now(),
      isOptimistic: true,
      status: "sending",
    };

    // Add optimistic message immediately
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
      await sendMessage({
        recipientUsername: otherUserProfile?.username || "",
        content: messageText,
        messageType: "text",
      });
      // Stop typing once message sent
      if (isTyping) {
        setIsTyping(false);
        void setTyping({
          otherUserId: otherUserId as Id<"users">,
          isTyping: false,
        });
      }

      // Record successful message for rate limiting and spam detection
      recordMessage(messageText);

      // Remove optimistic message on success (server message will replace it)
      setOptimisticMessages((prev) =>
        prev.filter((msg) => msg._id !== optimisticId),
      );

      // Keep input focused for continued typing
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (error) {
      console.error("Failed to send message:", error);

      // Mark optimistic message as failed
      setOptimisticMessages((prev) =>
        prev.map((msg) =>
          msg._id === optimisticId
            ? { ...msg, status: "failed" as const }
            : msg,
        ),
      );

      // Check if this is a repeated message error - show modal instead of toast
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send message";
      if (
        errorMessage.includes("repeatedly") ||
        errorMessage.includes("same message")
      ) {
        setSpamType("repeated");
        setSpamMessage(messageText);
        setShowSpamModal(true);
      } else {
        // Show error feedback for other failures
        console.error("Failed to send message");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedMessage = async (optimisticId: string, content: string) => {
    // Update message status to sending
    setOptimisticMessages((prev) =>
      prev.map((msg) =>
        msg._id === optimisticId ? { ...msg, status: "sending" as const } : msg,
      ),
    );

    try {
      await sendMessage({
        recipientUsername: otherUserProfile?.username || "",
        content,
        messageType: "text",
      });

      // Remove optimistic message on success
      setOptimisticMessages((prev) =>
        prev.filter((msg) => msg._id !== optimisticId),
      );
    } catch (error) {
      console.error("Failed to retry message:", error);

      // Mark as failed again
      setOptimisticMessages((prev) =>
        prev.map((msg) =>
          msg._id === optimisticId
            ? { ...msg, status: "failed" as const }
            : msg,
        ),
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  // Enhanced typing signals with proper debouncing using use-debounce
  const debouncedSignalTyping = useDebouncedCallback(
    useCallback(() => {
      const now = Date.now();

      // Only send typing signal if enough time has passed since last signal
      const timeSinceLastSignal = now - lastTypingSignalRef.current;
      const TYPING_DEBOUNCE_MS = 1000; // Minimum 1 second between typing signals

      if (timeSinceLastSignal >= TYPING_DEBOUNCE_MS) {
        // Send start typing on first keystroke
        if (!isTyping) {
          setIsTyping(true);
          void setTyping({
            otherUserId: otherUserId as Id<"users">,
            isTyping: true,
          });
          lastTypingSignalRef.current = now;
        }
      }

      // Reset inactivity timer
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        void setTyping({
          otherUserId: otherUserId as Id<"users">,
          isTyping: false,
        });
        lastTypingSignalRef.current = now;
      }, 3000);
    }, [isTyping, otherUserId, setTyping]),
    500, // Wait 500ms before processing typing signal
    { leading: false, trailing: true },
  );

  const signalTyping = useCallback(() => {
    debouncedSignalTyping();
  }, [debouncedSignalTyping]);

  const copyLobbyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Lobby code copied.");
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast.error("Couldn't copy the code. Copy it by hand.");
    }
  };

  const handleJoinLobby = async (lobbyId: string) => {
    try {
      await joinLobby({ lobbyId: lobbyId as Id<"lobbies"> });
      toast.success("You joined the lobby. Waiting for the host to start.");

      // Navigate to lobby page after joining
      if (onNavigateToLobby) {
        onNavigateToLobby(lobbyId);
      }
    } catch (error) {
      console.error("Failed to join lobby:", error);
      toast.error("Couldn't join the lobby. It may be full or closed.");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Helper function to determine message clustering
  const getMessagePosition = (
    currentMessage: Message | OptimisticMessage,
    previousMessage: Message | OptimisticMessage | null,
    nextMessage: Message | OptimisticMessage | null,
    hasTimeDividerBefore: boolean = false,
    hasTimeDividerAfter: boolean = false,
  ): "single" | "first" | "middle" | "last" => {
    const currentSender = currentMessage.senderId;
    const prevSender = previousMessage?.senderId;
    const nextSender = nextMessage?.senderId;

    // If there's a time divider before or after, break the streak
    const isFromSameSenderAsPrev =
      prevSender === currentSender && !hasTimeDividerBefore;
    const isFromSameSenderAsNext =
      nextSender === currentSender && !hasTimeDividerAfter;

    if (!isFromSameSenderAsPrev && !isFromSameSenderAsNext) return "single";
    if (!isFromSameSenderAsPrev && isFromSameSenderAsNext) return "first";
    if (isFromSameSenderAsPrev && isFromSameSenderAsNext) return "middle";
    if (isFromSameSenderAsPrev && !isFromSameSenderAsNext) return "last";
    return "single";
  };

  // Helper function to check if we need a time divider
  const needsTimeDivider = (
    currentMessage: Message | OptimisticMessage,
    previousMessage: Message | OptimisticMessage | null,
  ): boolean => {
    if (!previousMessage) return false;

    const getCurrentTimestamp = (msg: Message | OptimisticMessage) => {
      if ("isOptimistic" in msg) {
        return msg._creationTime;
      }
      return msg.timestamp;
    };

    const currentTime = getCurrentTimestamp(currentMessage);
    const previousTime = getCurrentTimestamp(previousMessage);

    return currentTime - previousTime > 10 * 60 * 1000; // 10 minutes in milliseconds
  };

  const renderTimeDivider = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
      new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() ===
      date.toDateString();

    let dateText;
    if (isToday) {
      dateText = "Today";
    } else if (isYesterday) {
      dateText = "Yesterday";
    } else {
      dateText = date.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    }

    const timeText = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs text-foreground/70">
          {dateText}, {timeText}
        </p>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  };

  const renderNotificationText = (content: string) => {
    const ticketLinkMatch = content.match(/Ticket:\s*(https?:\/\/[^\s]+)/);
    if (!ticketLinkMatch) return content;

    const [fullMatch, url] = ticketLinkMatch;
    const beforeLink = content.substring(0, content.indexOf(fullMatch));
    const afterLink = content.substring(
      content.indexOf(fullMatch) + fullMatch.length,
    );

    const handleTicketLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      e.stopPropagation();

      // Extract ticket ID from URL (format: /support/TICKET_ID)
      const urlParts = url.split("/support/");
      if (urlParts.length > 1) {
        const ticketId = urlParts[1];
        onNavigateToTicket?.(ticketId);
        void navigate({ to: "/support", search: { ticketId } });
      }
    };

    return (
      <>
        {beforeLink}
        <span className="my-2 flex items-center justify-between gap-3 rounded-md border border-border bg-white/[0.04] px-3 py-2">
          <span className="text-sm text-foreground">Support ticket</span>
          <a
            href={url}
            onClick={handleTicketLinkClick}
            className="inline-flex items-center gap-1 rounded text-sm font-medium text-gold-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          >
            Open
            <ExternalLink className="size-3.5" />
          </a>
        </span>
        {afterLink}
      </>
    );
  };

  const renderMessage = (
    message: Message | OptimisticMessage,
    isOwn: boolean,
    messagePosition: "single" | "first" | "middle" | "last",
    isOptimistic = false,
  ) => {
    const isLastOfGroup =
      messagePosition === "single" || messagePosition === "last";
    const showAvatar = !isOwn && isLastOfGroup;
    const isCard = message.messageType !== "text";
    const failed =
      isOptimistic && "status" in message && message.status === "failed";
    const sending =
      isOptimistic && "status" in message && message.status === "sending";
    const timestamp =
      "isOptimistic" in message ? message._creationTime : message.timestamp;

    return (
      <motion.div
        key={message._id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "flex items-end gap-2",
          isLastOfGroup || failed ? "mb-3" : "mb-0.5",
          isOwn ? "justify-end" : "justify-start",
        )}
      >
        {!isOwn && (
          <div className="flex w-8 shrink-0 items-end">
            {showAvatar &&
              (isNotificationConversation ? (
                <BrandMark className="size-7" />
              ) : (
                <UserAvatar
                  username={
                    message.senderUsername || otherUserProfile?.username || ""
                  }
                  avatarUrl={otherUserProfile?.avatarUrl}
                  rank={otherUserProfile?.rank}
                  size="sm"
                  frame={otherUserProfile?.avatarFrame}
                />
              ))}
          </div>
        )}

        <div
          className={cn(
            "flex min-w-0 max-w-[80%] flex-col",
            isOwn ? "items-end" : "items-start",
          )}
        >
          <div
            className={cn(
              "min-w-0 rounded-lg border px-3 py-2 transition-opacity",
              isOwn
                ? "border-gold-500/25 bg-gold-500/10 text-foreground"
                : "border-border bg-white/[0.06] text-foreground",
              isOwn && isLastOfGroup && "rounded-br-sm",
              !isOwn && isLastOfGroup && "rounded-bl-sm",
              isCard && "w-full border-border bg-white/[0.04] p-3",
              sending && "opacity-70",
              failed && "border-red-500/40 bg-red-500/10",
            )}
          >
            {message.messageType === "lobby_invite" ? (
              <LobbyInviteMessage
                message={message}
                onNavigateToLobby={onNavigateToLobby}
                copyLobbyCode={(code) => void copyLobbyCode(code)}
                currentUserId={currentUserProfile?.userId}
                onJoinLobby={handleJoinLobby}
              />
            ) : message.messageType === "game_invite" ? (
              <div className="w-full min-w-[220px] space-y-3">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Eye className="size-4 shrink-0" />
                    Game invite
                  </p>
                  <p className="mt-0.5 text-sm text-foreground/80">
                    Watch this game live.
                  </p>
                </div>
                {message.gameId && onNavigateToGame && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onNavigateToGame(message.gameId!)}
                  >
                    <Eye />
                    Spectate
                  </Button>
                )}
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {isNotificationConversation
                  ? renderNotificationText(message.content)
                  : message.content}
              </div>
            )}
          </div>

          {(isLastOfGroup || failed) && (
            <div
              className={cn(
                "mt-1 flex items-center gap-2 text-xs text-muted-foreground",
                isOwn ? "justify-end" : "justify-start",
              )}
            >
              {failed ? (
                <>
                  <span className="text-red-300">Not sent</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-red-200 hover:text-red-100"
                    onClick={() =>
                      void retryFailedMessage(message._id, message.content)
                    }
                  >
                    Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() =>
                      setOptimisticMessages((prev) =>
                        prev.filter((m) => m._id !== message._id),
                      )
                    }
                  >
                    Remove
                  </Button>
                </>
              ) : sending ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" />
                  Sending
                </span>
              ) : (
                <>
                  <span className="tabular-nums">
                    {formatTime(timestamp)}
                  </span>
                  {isOwn && !isNotificationConversation && (
                    <span
                      className={cn(
                        message.readAt
                          ? "text-gold-300"
                          : "text-muted-foreground",
                      )}
                    >
                      {message.readAt
                        ? "Read"
                        : message.deliveredAt
                          ? "Delivered"
                          : "Sent"}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      debouncedSignalTyping.cancel(); // Cancel any pending debounced calls
    };
  }, [debouncedSignalTyping]);

  if (!otherUserProfile) {
    return (
      <div className="flex h-full flex-col" aria-hidden="true">
        <div className="flex items-center gap-3 border-b border-border p-4 pr-14">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    );
  }

  const headerStatus = !isNotificationConversation
    ? getHeaderStatus(otherUserProfile.username)
    : null;
  const winsLabel = `${otherUserProfile.wins} ${otherUserProfile.wins === 1 ? "win" : "wins"}`;
  const lossesLabel = `${otherUserProfile.losses} ${otherUserProfile.losses === 1 ? "loss" : "losses"}`;

  return (
    <>
      <div className="flex h-full flex-col bg-card">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border py-3 pl-2 pr-14">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              aria-label="Back to messages"
              className="h-10 w-10 shrink-0"
            >
              <ArrowLeft />
            </Button>
          )}
          <div className="relative shrink-0">
            {isNotificationConversation ? (
              <div className="flex size-10 items-center justify-center">
                <BrandMark className="size-8" />
              </div>
            ) : (
              <UserAvatar
                username={otherUserProfile?.username || ""}
                avatarUrl={otherUserProfile?.avatarUrl}
                size="md"
                frame={otherUserProfile?.avatarFrame}
                rank={otherUserProfile?.rank}
              />
            )}
            {headerStatus?.indicator && (
              <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-0.5">
                {headerStatus.indicator}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {isNotificationConversation ? (
              <h3 className="text-base font-semibold text-foreground">
                Notifications
              </h3>
            ) : (
              <button
                type="button"
                className="block max-w-full rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                onClick={() => {
                  if (otherUserProfile?.username) {
                    void navigate({
                      to: "/profile",
                      search: { u: otherUserProfile.username },
                    });
                  }
                }}
              >
                <UserNameWithBadge
                  username={otherUserProfile?.username || "Unknown"}
                  tier={
                    otherUserProfile?.tier as
                      | "free"
                      | "pro"
                      | "pro_plus"
                      | undefined
                  }
                  isDonor={otherUserProfile?.isDonor}
                  usernameColor={otherUserProfile?.usernameColor}
                  size="lg"
                />
              </button>
            )}
            {isNotificationConversation ? (
              <p className="text-xs text-foreground/75">
                Updates about your account and support tickets
              </p>
            ) : headerStatus?.text ? (
              <p className="text-xs text-foreground/85">{headerStatus.text}</p>
            ) : (
              <p className="truncate text-xs text-foreground/75">
                {otherUserProfile.bio
                  ? otherUserProfile.bio.length > 50
                    ? `${otherUserProfile.bio.substring(0, 50)}...`
                    : otherUserProfile.bio
                  : [otherUserProfile.rank, `${winsLabel}, ${lossesLabel}`]
                      .filter(Boolean)
                      .join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* Retention notice */}
        <p className="shrink-0 border-b border-border px-4 py-2 text-center text-xs text-foreground/70">
          Messages are deleted after 7 days.
        </p>

        {/* Messages */}
        <div
          role="log"
          aria-label="Messages"
          className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        >
          {messagesLoading ? (
            <div className="space-y-4" aria-hidden="true">
              {[
                ["w-2/3", false],
                ["w-1/2", false],
                ["w-3/5", true],
                ["w-2/5", true],
                ["w-3/4", false],
              ].map(([w, own], i) => (
                <div
                  key={i}
                  className={cn("flex", own ? "justify-end" : "justify-start")}
                >
                  <Skeleton className={cn("h-10", w as string)} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="text-base font-medium text-foreground">
                {isNotificationConversation
                  ? "No notifications yet"
                  : "No messages yet"}
              </p>
              <p className="mt-1 max-w-xs text-sm text-foreground/75">
                {isNotificationConversation
                  ? "Account and support updates show up here."
                  : `Say hi to ${otherUserProfile?.username}.`}
              </p>
            </div>
          ) : (
            <div>
              {hasMoreOlder && (
                <div className="mb-4 flex justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void loadOlderMessages()}
                    disabled={isFetchingOlder}
                  >
                    {isFetchingOlder ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Loading
                      </>
                    ) : (
                      "Load earlier messages"
                    )}
                  </Button>
                </div>
              )}
              {messages.map((message: Message | OptimisticMessage, index) => {
                const isOptimistic = "isOptimistic" in message;
                const isOwn = isNotificationConversation
                  ? false
                  : isOptimistic ||
                    message.senderId === currentUserProfile?.userId;

                // Determine message position for clustering
                const previousMessage = index > 0 ? messages[index - 1] : null;
                const nextMessage =
                  index < messages.length - 1 ? messages[index + 1] : null;

                // Check if we need time dividers
                const showTimeDividerBefore = needsTimeDivider(
                  message,
                  previousMessage,
                );
                const showTimeDividerAfter =
                  index < messages.length - 1
                    ? needsTimeDivider(messages[index + 1], message)
                    : false;

                const messagePosition = getMessagePosition(
                  message,
                  previousMessage,
                  nextMessage,
                  showTimeDividerBefore,
                  showTimeDividerAfter,
                );

                return (
                  <div key={message._id}>
                    {showTimeDividerBefore &&
                      renderTimeDivider(
                        "isOptimistic" in message
                          ? message._creationTime
                          : message.timestamp,
                      )}
                    {renderMessage(
                      message,
                      isOwn,
                      messagePosition,
                      isOptimistic,
                    )}
                  </div>
                );
              })}
              {typingStatus?.isTyping && (
                <div
                  className="mb-3 flex items-end gap-2"
                  role="status"
                  aria-label={`${otherUserProfile.username} is typing`}
                >
                  <div className="flex w-8 shrink-0 items-end">
                    <UserAvatar
                      username={otherUserProfile.username}
                      avatarUrl={otherUserProfile.avatarUrl}
                      rank={otherUserProfile.rank}
                      size="sm"
                    />
                  </div>
                  <div className="rounded-lg rounded-bl-sm border border-border bg-white/[0.06] px-3 py-3">
                    <div className="flex items-center gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.2s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.1s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-foreground/60" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message input: not shown in the notifications thread */}
        {!isNotificationConversation && (
          <div className="shrink-0 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                placeholder={`Message ${otherUserProfile?.username}`}
                aria-label={`Message ${otherUserProfile?.username}`}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  signalTyping();
                }}
                onKeyDown={handleKeyDown}
                enterKeyHint="send"
                autoComplete="off"
                className="flex-1"
              />
              <Button
                onClick={() => void handleSendMessage()}
                disabled={!newMessage.trim() || isLoading}
                size="icon"
                aria-label="Send message"
                className="shrink-0"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
              </Button>
            </div>
          </div>
        )}
      </div>

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
    </>
  );
}
