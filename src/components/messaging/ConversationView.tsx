import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Copy,
  ExternalLink,
  Users,
  CheckCheck,
  Check,
  AlertCircle,
  ArrowLeft,
  GamepadIcon,
  Target,
  Bell,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useConvex, useMutation } from "convex/react";
import { useConvexQueryWithOptions } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UserAvatar } from "../UserAvatar";
import { UserNameWithBadge } from "../UserNameWithBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
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
  onJoinLobby?: (lobbyId: string) => void;
}

function LobbyInviteMessage({
  message,
  onNavigateToLobby,
  copyLobbyCode,
  currentUserId,
  onJoinLobby,
}: LobbyInviteMessageProps) {
  const { data: lobbyInfo } = useConvexQuery(
    api.lobbies.getLobby,
    message.lobbyId ? { lobbyId: message.lobbyId as Id<"lobbies"> } : "skip",
  );

  const isOwnMessage = message.senderId === currentUserId;

  return (
    <div className="space-y-3 font-mono">
      {/* Header with icon and lobby name */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
          <Users className="w-3 h-3" />
          <span>LOBBY_INVITE_PROTOCOL</span>
        </div>
        {message.lobbyName && (
          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-950/50 px-2 py-0.5 rounded border border-white/5">
            {message.lobbyName}
          </span>
        )}
      </div>

      {/* Status indicator */}
      {lobbyInfo ? (
        <div className="flex items-center justify-between">
          {lobbyInfo.status === "waiting" ? (
            <div className="text-[10px] text-green-400 flex items-center gap-2 uppercase tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              STATUS: OPEN ({lobbyInfo.playerId ? "2/2" : "1/2"})
            </div>
          ) : lobbyInfo.status === "playing" ? (
            <div className="text-[10px] text-amber-400 flex items-center gap-2 uppercase tracking-wide">
              <div className="w-2 h-2 bg-amber-400 rounded-sm animate-pulse"></div>
              STATUS: ENGAGED
            </div>
          ) : (
            <div className="text-[10px] text-red-400 flex items-center gap-2 uppercase tracking-wide">
              <div className="w-2 h-2 bg-red-400 rounded-sm"></div>
              STATUS: TERMINATED
            </div>
          )}

          {/* Action buttons - compact */}
          <div className="flex ml-2 gap-1">
            {message.lobbyCode && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyLobbyCode(message.lobbyCode!)}
                className="h-6 px-2 text-[10px] font-mono uppercase bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700"
              >
                <Copy className="w-3 h-3 mr-1" />
                Code
              </Button>
            )}
            {!isOwnMessage &&
              message.lobbyId &&
              lobbyInfo?.status === "waiting" &&
              onJoinLobby && (
                <Button
                  size="sm"
                  onClick={() => onJoinLobby(message.lobbyId!)}
                  className="h-6 px-3 text-[10px] font-bold font-mono uppercase bg-green-600/20 text-green-400 border border-green-500/50 hover:bg-green-600/40 hover:text-green-300"
                >
                  Confirm Join
                </Button>
              )}
            {!isOwnMessage &&
              message.lobbyId &&
              onNavigateToLobby &&
              (lobbyInfo?.status === "playing" ||
                lobbyInfo?.status === "finished") && (
                <Button
                  size="sm"
                  onClick={() => onNavigateToLobby(message.lobbyId!)}
                  className="h-6 px-3 text-[10px] font-bold font-mono uppercase bg-purple-600/20 text-purple-400 border border-purple-500/50 hover:bg-purple-600/40 hover:text-purple-300"
                  disabled={lobbyInfo.status === "finished"}
                >
                  Observe
                </Button>
              )}
          </div>
        </div>
      ) : message.lobbyId ? (
        <div className="text-[10px] text-red-400/80 flex items-center gap-2 uppercase font-mono">
          <AlertCircle className="w-3 h-3" />
          UPLINK_EXPIRED // TARGET_LOST
        </div>
      ) : (
        message.lobbyCode && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyLobbyCode(message.lobbyCode!)}
              className="h-6 px-2 text-[10px] font-mono uppercase bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700"
            >
              <Copy className="w-3 h-3 mr-1" />
              Code
            </Button>
          </div>
        )
      )}
    </div>
  );
}

type ConversationMode = "message" | "notification";

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
  const { onlineUsers } = useOnlineUsers();

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

  // Helper: status indicator node and status text for header
  const getHeaderStatus = (username?: string) => {
    if (!username)
      return {
        indicator: null as React.ReactNode,
        text: null as string | null,
      };
    const user = onlineUsers?.find(
      (u: { username: string }) => u.username === username,
    );
    if (!user)
      return {
        indicator: null as React.ReactNode,
        text: null as string | null,
      };

    if (user.gameId) {
      return {
        indicator: <GamepadIcon className="w-3 h-3 text-red-400" />,
        text: "In Game",
      };
    }
    if (user.lobbyId) {
      return {
        indicator: <Target className="w-3 h-3 text-green-400" />,
        text: "In Lobby",
      };
    }
    if (user.aiGameId) {
      return {
        indicator: <GamepadIcon className="w-3 h-3 text-yellow-400" />,
        text: "In AI Game",
      };
    }
    // Generally online
    return {
      indicator: <div className="w-3 h-3 bg-green-400 rounded-full" />,
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
  console.log("🔧 Is notification conversation:", isNotificationConversation);
  console.log("🔧 Other user ID:", otherUserId);
  console.log("🔧 Current user profile ID:", currentUserProfile?._id);

  // Determine conversation mode
  const conversationMode: ConversationMode = isNotificationConversation
    ? "notification"
    : "message";
  console.log("🔧 Conversation mode:", conversationMode);

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
      toast.success("Lobby code copied!");
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast.error("Failed to copy code");
    }
  };

  const handleJoinLobby = async (lobbyId: string) => {
    try {
      await joinLobby({ lobbyId: lobbyId as Id<"lobbies"> });
      toast.success("Joined lobby! Waiting for host to start the game...");

      // Navigate to lobby page after joining
      if (onNavigateToLobby) {
        onNavigateToLobby(lobbyId);
      }
    } catch (error) {
      console.error("Failed to join lobby:", error);
      toast.error("Failed to join lobby");
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

  const formatFullTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
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
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    const timeText = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="flex items-center justify-center my-6">
        <div className="flex-1 h-px bg-white/20"></div>
        <div className="px-3 py-1 mx-4 text-xs text-white/60">
          {dateText} at {timeText}
        </div>
        <div className="flex-1 h-px bg-white/20"></div>
      </div>
    );
  };

  const renderMessage = (
    message: Message | OptimisticMessage,
    isOwn: boolean,
    messagePosition: "single" | "first" | "middle" | "last",
    isOptimistic = false,
  ) => {
    const showAvatar =
      !isOwn && (messagePosition === "single" || messagePosition === "last"); // Show avatar at the bottom for incoming
    const showTimestamp =
      messagePosition === "single" || messagePosition === "last";

    // Adjust spacing based on message position
    const marginBottom =
      messagePosition === "last" || messagePosition === "single"
        ? "mb-6"
        : "mb-0.5";

    // Angular tactical corners
    const getBorderRadius = () => {
      const baseRadius = "rounded-sm"; // Default sharp corners

      if (isOwn) {
        // Own messages (Right side)
        switch (messagePosition) {
          case "single":
            return "rounded-lg rounded-tr-none";
          case "first":
            return "rounded-lg rounded-tr-none rounded-br-none";
          case "middle":
            return "rounded-lg rounded-r-none";
          case "last":
            return "rounded-lg rounded-br-none rounded-tr-none";
          default:
            return baseRadius;
        }
      } else {
        // Other messages (Left side)
        switch (messagePosition) {
          case "single":
            return "rounded-lg rounded-tl-none";
          case "first":
            return "rounded-lg rounded-tl-none rounded-bl-none";
          case "middle":
            return "rounded-lg rounded-l-none";
          case "last":
            return "rounded-lg rounded-bl-none rounded-tl-none";
          default:
            return baseRadius;
        }
      }
    };

    return (
      <motion.div
        key={message._id}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "flex gap-3 items-end group",
          marginBottom,
          isOwn ? "justify-end" : "justify-start",
        )}
      >
        {!isOwn && (
          <div className="w-8 flex flex-col justify-end self-end shrink-0">
            {showAvatar ? (
              isNotificationConversation ? (
                <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                  <Bell className="w-4 h-4 text-blue-400" />
                </div>
              ) : (
                <UserAvatar
                  username={
                    message.senderUsername || otherUserProfile?.username || ""
                  }
                  avatarUrl={otherUserProfile?.avatarUrl}
                  rank={otherUserProfile?.rank}
                  size="sm"
                  frame={otherUserProfile?.avatarFrame}
                  className="mb-1"
                />
              )
            ) : (
              <div className="w-8 h-8"></div>
            )}
          </div>
        )}

        {/* Timestamp and status for own messages (left side of bubble) */}
        {isOwn && showTimestamp && (
          <div className="flex gap-1.5 items-center mb-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isOptimistic && (
              <div className="flex items-center">
                {message.readAt ? (
                  <CheckCheck className="w-3 h-3 text-amber-500" />
                ) : message.deliveredAt ? (
                  <Check className="w-3 h-3 text-zinc-600" />
                ) : (
                  <div className="w-2 h-2 rounded-full border border-zinc-600" />
                )}
              </div>
            )}
            <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
              {formatTime(
                "isOptimistic" in message
                  ? message._creationTime
                  : message.timestamp,
              )}
            </div>
            {isOptimistic && "status" in message && (
              <div className="flex items-center">
                {message.status === "sending" ? (
                  <div className="w-2 h-2 border border-amber-500/50 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-[9px] text-red-500 font-mono uppercase">
                    ERR
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            "max-w-[75%] relative",
            isOwn ? "items-end" : "items-start",
          )}
        >
          {/* Message bubble */}
          <div
            className={cn(
              "px-4 py-3 shadow-sm relative backdrop-blur-sm border transition-all duration-200",
              getBorderRadius(),
              isOwn
                ? "bg-amber-500/10 border-amber-500/20 text-amber-100/90 shadow-[0_0_15px_-5px_rgba(245,158,11,0.1)]"
                : isNotificationConversation
                  ? "bg-blue-900/10 border-blue-500/20 text-blue-100/90"
                  : "bg-zinc-900/80 border-white/5 text-zinc-300 hover:border-zinc-700",
              message.messageType !== "text" &&
                !isOwn &&
                "bg-transparent border-transparent px-0 py-0 shadow-none hover:border-transparent",
              message.messageType !== "text" &&
                isOwn &&
                "bg-transparent border-transparent px-0 py-0 shadow-none hover:border-transparent",
              isOptimistic &&
                "opacity-70 border-dashed border-amber-500/30 bg-transparent",
            )}
          >
            {message.messageType === "lobby_invite" ? (
              <div
                className={cn(
                  "p-3 rounded border w-full min-w-[260px]",
                  isOwn
                    ? "bg-amber-950/30 border-amber-500/20"
                    : "bg-zinc-900/50 border-white/10",
                )}
              >
                <LobbyInviteMessage
                  message={message}
                  onNavigateToLobby={onNavigateToLobby}
                  copyLobbyCode={(code) => void copyLobbyCode(code)}
                  currentUserId={currentUserProfile?.userId}
                  onJoinLobby={(lobbyId) => void handleJoinLobby(lobbyId)}
                />
              </div>
            ) : message.messageType === "game_invite" ? (
              <div
                className={cn(
                  "p-3 rounded border min-w-[240px]",
                  isOwn
                    ? "bg-amber-950/30 border-amber-500/20"
                    : "bg-zinc-900/50 border-white/10",
                )}
              >
                <div className="space-y-2 font-mono">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
                      <ExternalLink className="w-3 h-3" />
                      <span>GAME_SPECTATE_LINK</span>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    {message.gameId && onNavigateToGame && (
                      <Button
                        size="sm"
                        onClick={() => onNavigateToGame(message.gameId!)}
                        className="h-6 px-3 text-[10px] font-bold font-mono uppercase bg-purple-600/20 text-purple-400 border border-purple-500/50 hover:bg-purple-600/40 hover:text-purple-300"
                      >
                        Initialize Uplink
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "text-sm whitespace-pre-wrap break-words leading-relaxed",
                  !isOwn && !isNotificationConversation && "font-sans",
                  isOwn && "font-sans",
                )}
              >
                {isNotificationConversation
                  ? (() => {
                      // Parse notification content for clickable ticket links
                      const ticketLinkMatch = message.content.match(
                        /Ticket:\s*(https?:\/\/[^\s]+)/,
                      );
                      if (ticketLinkMatch) {
                        const [fullMatch, url] = ticketLinkMatch;
                        const beforeLink = message.content.substring(
                          0,
                          message.content.indexOf(fullMatch),
                        );
                        const afterLink = message.content.substring(
                          message.content.indexOf(fullMatch) + fullMatch.length,
                        );

                        const handleTicketLinkClick = (
                          e: React.MouseEvent<HTMLAnchorElement>,
                        ) => {
                          e.preventDefault();
                          e.stopPropagation();

                          // Extract ticket ID from URL (format: /support/TICKET_ID)
                          const urlParts = url.split("/support/");
                          if (urlParts.length > 1) {
                            const ticketId = urlParts[1];
                            // Call the callback if provided
                            if (onNavigateToTicket) {
                              onNavigateToTicket(ticketId);
                            }
                            // Navigate to support page with ticket ID as query parameter
                            void navigate({
                              to: "/support",
                              search: { ticketId },
                            });
                          }
                        };

                        return (
                          <div className="font-mono text-xs">
                            {beforeLink}
                            <div className="my-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded flex items-center justify-between">
                              <span className="text-blue-200">
                                SUPPORT_TICKET_REF
                              </span>
                              <a
                                href={url}
                                onClick={handleTicketLinkClick}
                                className="text-blue-400 hover:text-blue-300 uppercase font-bold text-[10px] flex items-center gap-1"
                              >
                                ACCESS
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            {afterLink}
                          </div>
                        );
                      }
                      return (
                        <span className="font-mono text-xs text-blue-200/80">
                          {message.content}
                        </span>
                      );
                    })()
                  : message.content}
              </div>
            )}
          </div>

          {/* Timestamp for other user messages (right side, outside bubble) */}
          {!isOwn && showTimestamp && (
            <div className="absolute -right-12 bottom-0 text-[9px] font-mono text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(
                "isOptimistic" in message
                  ? message._creationTime
                  : message.timestamp,
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
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-zinc-950 text-zinc-300">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2 h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10 rounded-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="relative">
            {isNotificationConversation ? (
              <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <Bell className="w-5 h-5 text-blue-400" />
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
            {!isNotificationConversation &&
              (() => {
                const { indicator } = getHeaderStatus(
                  otherUserProfile?.username,
                );
                return indicator ? (
                  <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-0.5 border border-zinc-900">
                    {indicator}
                  </div>
                ) : null;
              })()}
          </div>
          <div className="flex-1 min-w-0">
            {isNotificationConversation ? (
              <h3 className="text-sm font-display font-bold uppercase tracking-wide text-white">
                Command_Notifications
              </h3>
            ) : (
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
                size="md"
                className="cursor-pointer hover:opacity-80 font-display tracking-wide"
                onClick={() => {
                  if (otherUserProfile?.username) {
                    void navigate({
                      to: "/profile",
                      search: { u: otherUserProfile.username },
                    });
                  }
                }}
              />
            )}
            {isNotificationConversation ? (
              <p className="text-[10px] font-mono text-blue-400/80 uppercase tracking-wider">
                System Uplink Active
              </p>
            ) : (
              (() => {
                const status = getHeaderStatus(otherUserProfile?.username);
                if (status.text) {
                  // Colorize status text only: In Lobby (green), In Game (red), In AI Game (yellow)
                  const colorClass =
                    status.text === "In Lobby"
                      ? "text-green-400"
                      : status.text === "In Game"
                        ? "text-red-400"
                        : "text-amber-400"; // In AI Game
                  return (
                    <div
                      className={`text-[10px] font-mono uppercase tracking-wider ${colorClass} flex items-center gap-2`}
                    >
                      <span className="w-1.5 h-1.5 rounded-sm bg-current animate-pulse"></span>
                      {status.text}
                    </div>
                  );
                }
                // Generally online: show bio/wins like before
                return (
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider truncate">
                    {otherUserProfile.bio
                      ? otherUserProfile.bio.length > 50
                        ? `${otherUserProfile.bio.substring(0, 50)}...`
                        : otherUserProfile.bio
                      : `${otherUserProfile.rank && `${otherUserProfile.rank} • `}${otherUserProfile.wins}W ${otherUserProfile.losses}L`}
                  </p>
                );
              })()
            )}
          </div>
        </div>

        {/* Retention notice */}
        <div className="px-4 py-2 border-b border-white/5 bg-amber-500/5">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-[10px] font-mono text-amber-500/60 cursor-help uppercase tracking-wider justify-center">
                <AlertCircle className="w-3 h-3 text-amber-500/60" />
                <span>AUTO_PURGE_PROTOCOL: T-MINUS 7 DAYS</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="backdrop-blur-xl z-[320] pointer-events-auto py-3 px-4 bg-zinc-950 border border-white/10 text-zinc-300 rounded-sm max-w-sm text-xs space-y-3 shadow-2xl">
              <div className="space-y-2 font-mono">
                <p className="font-bold text-amber-500 uppercase tracking-wider border-b border-amber-500/20 pb-1">
                  Retention Policy Protocol
                </p>
                <div className="space-y-1 text-zinc-400 text-[10px]">
                  <p>• DATA_EXPIRATION: 168 HOURS (7 DAYS)</p>
                  <p>• SCOPE: ALL TRANSMISSION TYPES</p>
                  <p>• STATUS: IRREVERSIBLE DELETION</p>
                  <p>• PURPOSE: OPTIMIZE DATABASE INTEGRITY</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {messagesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="w-8 h-8 rounded bg-white/5 border border-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded-sm w-3/4" />
                    <div className="h-4 bg-white/5 rounded-sm w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center opacity-50">
                <div className="w-16 h-16 rounded bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto mb-4 grayscale">
                  {isNotificationConversation ? (
                    <Bell className="w-8 h-8 text-zinc-500" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-zinc-500" />
                  )}
                </div>
                <p className="text-zinc-500 font-display uppercase tracking-widest text-sm mb-2">
                  {isNotificationConversation
                    ? "NO_ALERTS"
                    : "NO_TRANSMISSIONS"}
                </p>
                <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-wider">
                  {isNotificationConversation
                    ? "SYSTEM_STATUS_NORMAL"
                    : `LINK_ESTABLISHED: ${otherUserProfile?.username}`}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {hasMoreOlder && (
                <div className="flex justify-center mb-6">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void loadOlderMessages()}
                    disabled={isFetchingOlder}
                    className="h-6 px-4 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                  >
                    {isFetchingOlder
                      ? "ACCESSING_ARCHIVES..."
                      : "LOAD_ARCHIVED_DATA"}
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
                <div className="flex gap-3 items-end mb-4 justify-start">
                  <div className="w-8 flex flex-col justify-end self-end shrink-0">
                    <UserAvatar
                      username={otherUserProfile.username}
                      avatarUrl={otherUserProfile.avatarUrl}
                      rank={otherUserProfile.rank}
                      size="sm"
                      className="mb-1"
                    />
                  </div>
                  <div className="max-w-[70%] items-start">
                    <div className="px-3 py-2 shadow-sm relative rounded-lg rounded-bl-none bg-zinc-900/50 border border-white/5 text-zinc-400">
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                        <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                        <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input - Hidden for notification conversations */}
        {!isNotificationConversation && (
          <div className="p-4 border-t border-white/5 bg-zinc-900/50 backdrop-blur-md">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={`Transmitting to ${otherUserProfile?.username}...`}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  signalTyping();
                }}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-mono text-sm h-10 transition-all font-medium rounded-sm"
              />
              <Button
                onClick={() => void handleSendMessage()}
                disabled={!newMessage.trim() || isLoading}
                size="sm"
                className="bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/50 rounded-sm w-10 h-10 p-0 flex items-center justify-center disabled:opacity-50 disabled:bg-zinc-800 disabled:border-zinc-700"
              >
                <Send className="w-4 h-4" />
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
    </TooltipProvider>
  );
}
