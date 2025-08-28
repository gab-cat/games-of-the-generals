import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Copy, ExternalLink, Users, CheckCheck, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { useConvex, useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UserAvatar } from "../UserAvatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { profanity, CensorType } from "@2toad/profanity";
import { useConvexQuery } from "@/lib/convex-query-hooks";

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

function LobbyInviteMessage({ message, onNavigateToLobby, copyLobbyCode, currentUserId, onJoinLobby }: LobbyInviteMessageProps) {
  const { data: lobbyInfo } = useConvexQuery(
    api.lobbies.getLobby,
    message.lobbyId ? { lobbyId: message.lobbyId as Id<"lobbies"> } : "skip"
  );

  const isOwnMessage = message.senderId === currentUserId;

  return (
    <div className="space-y-2">
        {/* Header with icon and lobby name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Lobby Invite</span>
          </div>
          {message.lobbyName && (
            <span className="text-xs text-white/70 font-mono bg-white/10 px-2 py-1 rounded break-words max-w-[120px] truncate">
              {message.lobbyName}
            </span>
          )}
        </div>      {/* Status indicator */}
      {lobbyInfo ? (
        <div className="flex items-center justify-between">
          {lobbyInfo.status === "waiting" ? (
            <div className="text-xs text-green-400 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Available • {lobbyInfo.playerId ? "2/2" : "1/2"} players
            </div>
          ) : lobbyInfo.status === "playing" ? (
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              In Progress
            </div>
          ) : (
            <div className="text-xs text-red-400 flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              Ended
            </div>
          )}
          
          {/* Action buttons - compact */}
          <div className="flex ml-2 gap-1">
            {message.lobbyCode && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyLobbyCode(message.lobbyCode!)}
                className="h-6 px-2 text-xs text-white/80 hover:text-white hover:bg-white/20"
              >
                <Copy className="w-3 h-3" />
              </Button>
            )}
            {!isOwnMessage && message.lobbyId && lobbyInfo?.status === "waiting" && onJoinLobby && (
              <Button
                size="sm"
                onClick={() => onJoinLobby(message.lobbyId!)}
                className="h-6 px-3 text-xs bg-green-600 hover:bg-green-700"
              >
                Join
              </Button>
            )}
            {!isOwnMessage && message.lobbyId && onNavigateToLobby && (lobbyInfo?.status === "playing" || lobbyInfo?.status === "finished") && (
              <Button
                size="sm"
                onClick={() => onNavigateToLobby(message.lobbyId!)}
                className="h-6 px-3 text-xs bg-purple-600 hover:bg-purple-700"
                disabled={lobbyInfo.status === "finished"}
              >
                View
              </Button>
            )}
          </div>
        </div>
      ) : message.lobbyId ? (
        <div className="text-xs text-red-300/80 flex items-center gap-1">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          Invite expired • Lobby no longer exists
        </div>
      ) : (
        message.lobbyCode && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyLobbyCode(message.lobbyCode!)}
              className="h-6 px-2 text-xs text-white/80 hover:text-white hover:bg-white/20"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        )
      )}
    </div>
  );
}

export function ConversationView({ 
  otherUserId, 
  onNavigateToLobby,
  onNavigateToGame,
  onBack
}: ConversationViewProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const newestTimestampRef = useRef<number>(0);

  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);
  const joinLobby = useMutation(api.lobbies.joinLobby);
  const setTyping = useMutation(api.messages.setTyping);

  const convex = useConvex();
  // Load latest messages (single page)
  const { data: latestData, isLoading: messagesLoading } = useConvexQuery(
    api.messages.getConversationMessages,
    { otherUserId, paginationOpts: { numItems: 20 } }
  );
  const serverMessages = latestData?.page || [];
  // Manual pagination state for older messages
  const [olderMessages, setOlderMessages] = useState<Message[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = useState<boolean>(false);
  const [isFetchingOlder, setIsFetchingOlder] = useState<boolean>(false);

  // Merge older + server messages with optimistic messages
  const messages = [...olderMessages, ...serverMessages, ...optimisticMessages].sort((a, b) => {
    const aTime = 'timestamp' in a ? (a.timestamp ?? 0) : a._creationTime;
    const bTime = 'timestamp' in b ? (b.timestamp ?? 0) : b._creationTime;
    return aTime - bTime;
  });

  const { data: otherUserProfile } = useConvexQuery(
    api.profiles.getProfileByUserId,
    { userId: otherUserId }
  );

  const currentUserProfile = useQuery(api.profiles.getCurrentProfile);

  // Typing status of the other user
  const { data: typingStatus } = useConvexQuery(
    api.messages.getTypingStatus,
    { otherUserId }
  );

  // Local typing state and idle timeout
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevent concurrent mark-as-read calls and reduce write conflicts
  const isMarkingReadRef = useRef(false);
  const lastMarkReadAtRef = useRef(0);

  // Auto-scroll to bottom when new messages arrive (but not when loading older pages)
  const loadingOlderRef = useRef(false);
  const loadOlderMessages = async () => {
    if (isFetchingOlder) return;
    // Compute earliest timestamp from currently loaded messages
    const allLoaded: Array<Message | OptimisticMessage> = [...olderMessages, ...serverMessages];
    if (allLoaded.length === 0) return;
    const earliest = allLoaded.reduce((min, msg: any) => {
      const t = 'timestamp' in msg ? msg.timestamp : msg._creationTime;
      return Math.min(min, t ?? Number.POSITIVE_INFINITY);
    }, Number.POSITIVE_INFINITY);
    if (!isFinite(earliest)) return;
    setIsFetchingOlder(true);
    loadingOlderRef.current = true;
    try {
      const resp: any = await convex.query(api.messages.getConversationMessages, {
        otherUserId: otherUserId as Id<"users">,
        beforeTimestamp: earliest,
        paginationOpts: { numItems: 20 },
      });
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
      const t = 'timestamp' in msg ? msg.timestamp : msg._creationTime;
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
    if (typeof latestData === "object" && latestData !== null && "hasMore" in latestData) {
      const hasMore = (latestData as { hasMore?: boolean }).hasMore;
      if (typeof hasMore === "boolean") {
        setHasMoreOlder(hasMore);
        return;
      }
    }
    if (typeof latestData === "object" && latestData !== null && "isDone" in latestData) {
      const isDone = (latestData as { isDone?: boolean }).isDone;
      setHasMoreOlder(Boolean(isDone === false));
      return;
    }
    // Fallback: if older shape ever returns an array, infer via page size
    if (Array.isArray(latestData)) {
      setHasMoreOlder(latestData.length >= 20);
    }
  }, [otherUserId, latestData]);

  // Mark messages as read when there are unread incoming messages from the other user
  useEffect(() => {
    if (!currentUserProfile) return;

    const hasUnreadIncoming = messages.some((m) => {
      if ('isOptimistic' in m) return false;
      const msg = m as Message;
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
  }, [messages, otherUserId, currentUserProfile, markAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage.trim();
    const censoredText = profanity.censor(messageText, CensorType.Word);
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    
    // Create optimistic message
    const optimisticMessage: OptimisticMessage = {
      _id: optimisticId,
      content: censoredText,
      messageType: "text",
      senderId: currentUserProfile?.userId || "",
      _creationTime: Date.now(),
      isOptimistic: true,
      status: "sending"
    };

    // Add optimistic message immediately
    setOptimisticMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
      await sendMessage({
        recipientUsername: otherUserProfile?.username || "",
        content: censoredText,
        messageType: "text",
      });
      // Stop typing once message sent
      if (isTyping) {
        setIsTyping(false);
        void setTyping({ otherUserId: otherUserId as Id<"users">, isTyping: false });
      }
      
      // Remove optimistic message on success (server message will replace it)
      setOptimisticMessages(prev => prev.filter(msg => msg._id !== optimisticId));
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Mark optimistic message as failed
      setOptimisticMessages(prev => 
        prev.map(msg => 
          msg._id === optimisticId 
            ? { ...msg, status: "failed" as const }
            : msg
        )
      );
      
      // Show error feedback
      console.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedMessage = async (optimisticId: string, content: string) => {
    // Update message status to sending
    setOptimisticMessages(prev => 
      prev.map(msg => 
        msg._id === optimisticId 
          ? { ...msg, status: "sending" as const }
          : msg
      )
    );

    try {
      await sendMessage({
        recipientUsername: otherUserProfile?.username || "",
        content,
        messageType: "text",
      });
      
      // Remove optimistic message on success
      setOptimisticMessages(prev => prev.filter(msg => msg._id !== optimisticId));
    } catch (error) {
      console.error("Failed to retry message:", error);
      
      // Mark as failed again
      setOptimisticMessages(prev => 
        prev.map(msg => 
          msg._id === optimisticId 
            ? { ...msg, status: "failed" as const }
            : msg
        )
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  // Handle typing signals
  const signalTyping = () => {
    // Send start typing on first keystroke
    if (!isTyping) {
      setIsTyping(true);
      void setTyping({ otherUserId: otherUserId as Id<"users">, isTyping: true });
    }
    // Reset inactivity timer
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      void setTyping({ otherUserId: otherUserId as Id<"users">, isTyping: false });
    }, 3000);
  };

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
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatFullTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Helper function to determine message clustering
  const getMessagePosition = (
    currentMessage: Message | OptimisticMessage,
    previousMessage: Message | OptimisticMessage | null,
    nextMessage: Message | OptimisticMessage | null,
    hasTimeDividerBefore: boolean = false,
    hasTimeDividerAfter: boolean = false
  ): 'single' | 'first' | 'middle' | 'last' => {
    const currentSender = currentMessage.senderId;
    const prevSender = previousMessage?.senderId;
    const nextSender = nextMessage?.senderId;

    // If there's a time divider before or after, break the streak
    const isFromSameSenderAsPrev = prevSender === currentSender && !hasTimeDividerBefore;
    const isFromSameSenderAsNext = nextSender === currentSender && !hasTimeDividerAfter;

    if (!isFromSameSenderAsPrev && !isFromSameSenderAsNext) return 'single';
    if (!isFromSameSenderAsPrev && isFromSameSenderAsNext) return 'first';
    if (isFromSameSenderAsPrev && isFromSameSenderAsNext) return 'middle';
    if (isFromSameSenderAsPrev && !isFromSameSenderAsNext) return 'last';
    return 'single';
  };

  // Helper function to check if we need a time divider
  const needsTimeDivider = (currentMessage: Message | OptimisticMessage, previousMessage: Message | OptimisticMessage | null): boolean => {
    if (!previousMessage) return false;
    
    const getCurrentTimestamp = (msg: Message | OptimisticMessage) => {
      if ('isOptimistic' in msg) {
        return msg._creationTime;
      }
      return msg.timestamp;
    };

    const currentTime = getCurrentTimestamp(currentMessage);
    const previousTime = getCurrentTimestamp(previousMessage);
    
    return (currentTime - previousTime) > 10 * 60 * 1000; // 10 minutes in milliseconds
  };

  const renderTimeDivider = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
    
    let dateText;
    if (isToday) {
      dateText = "Today";
    } else if (isYesterday) {
      dateText = "Yesterday";
    } else {
      dateText = date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    const timeText = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
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

  const renderMessage = (message: Message | OptimisticMessage, isOwn: boolean, messagePosition: 'single' | 'first' | 'middle' | 'last', isOptimistic = false) => {
    const showAvatar = messagePosition === 'single' || messagePosition === 'first';
    const showTimestamp = messagePosition === 'single' || messagePosition === 'last';
    
    // Adjust spacing based on message position
    const marginBottom = messagePosition === 'last' || messagePosition === 'single' ? 'mb-4' : 'mb-1';
    
    // Adjust border radius based on message position and owner
    const getBorderRadius = () => {
      const baseRadius = 'rounded-2xl';
      
      if (isOwn) {
        switch (messagePosition) {
          case 'single':
            return 'rounded-2xl rounded-br-md';
          case 'first':
            return 'rounded-2xl rounded-br-md';
          case 'middle':
            return 'rounded-r-md rounded-l-2xl';
          case 'last':
            return 'rounded-2xl rounded-tr-md';
          default:
            return baseRadius;
        }
      } else {
        switch (messagePosition) {
          case 'single':
            return 'rounded-2xl rounded-bl-md';
          case 'first':
            return 'rounded-2xl rounded-bl-md';
          case 'middle':
            return 'rounded-l-md rounded-r-2xl';
          case 'last':
            return 'rounded-2xl rounded-tl-md';
          default:
            return baseRadius;
        }
      }
    };

    return (
      <motion.div
        key={message._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex gap-2 items-end",
          marginBottom,
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        {!isOwn && (
          <div className="w-8 flex flex-col justify-start">
            {showAvatar ? (
              <UserAvatar
                username={message.senderUsername || otherUserProfile?.username || ""}
                avatarUrl={otherUserProfile?.avatarUrl}
                rank={otherUserProfile?.rank}
                size="sm"
                className="mb-1"
              />
            ) : (
              <div className="w-8 h-8"></div>
            )}
          </div>
        )}
        
                {/* Timestamp and status for own messages (left side) */}
        {isOwn && showTimestamp && (
          <div className="flex gap-1 flex-row items-end justify-end mb-1 min-w-0">
            <div className="text-xs text-white/50">
              {formatTime('isOptimistic' in message ? message._creationTime : message.timestamp)}
            </div>
            {!isOptimistic && (
              <div className="flex items-center mt-0.5">
                {message.readAt ? (
                  <CheckCheck className="w-3 h-3 text-blue-400" />
                ) : message.deliveredAt ? (
                  <Check className="w-3 h-3 text-white/50" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-yellow-400" />
                )}
              </div>
            )}
            {isOptimistic && 'status' in message && (
              <div className="flex items-center mt-0.5">
                {message.status === "sending" ? (
                  <div className="w-3 h-3 border border-white/30 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 px-1 text-xs text-red-400 hover:text-red-300"
                    onClick={() => void retryFailedMessage(message._id, message.content)}
                  >
                    Retry
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className={cn(
          "max-w-[70%]",
          isOwn ? "items-end" : "items-start"
        )}>
          {/* Message bubble with tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "px-4 py-2 shadow-sm relative",
                getBorderRadius(),
                isOwn 
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-white",
                message.messageType !== "text" && "border border-white/20",
                isOptimistic && "opacity-70"
              )}>
                {message.messageType === "lobby_invite" ? (
                  <LobbyInviteMessage 
                    message={message}
                    onNavigateToLobby={onNavigateToLobby}
                    copyLobbyCode={(code) => void copyLobbyCode(code)}
                    currentUserId={currentUserProfile?.userId}
                    onJoinLobby={(lobbyId) => void handleJoinLobby(lobbyId)}
                  />
                ) : message.messageType === "game_invite" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ExternalLink className="w-4 h-4 text-purple-400" />
                        <span>Game Invite</span>
                      </div>
                      {message.gameId && onNavigateToGame && (
                        <Button
                          size="sm"
                          onClick={() => onNavigateToGame(message.gameId!)}
                          className="h-6 px-3 text-xs bg-purple-600 hover:bg-purple-700"
                        >
                          Watch
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="backdrop-blur-xl py-1 bg-black/40 text-xs text-white/80 rounded-xl p-2">
              <p className="text-xs">{formatFullTimestamp('isOptimistic' in message ? message._creationTime : message.timestamp)}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Timestamp for other user messages (right side) */}
        {!isOwn && showTimestamp && (
          <div className="flex flex-col items-start justify-end mb-1 min-w-0">
            <div className="text-xs text-white/50">
              {formatTime('isOptimistic' in message ? message._creationTime : message.timestamp)}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  if (!otherUserProfile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-gray-900/20">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gray-900/40">
          {onBack && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <UserAvatar
            username={otherUserProfile.username}
            avatarUrl={otherUserProfile.avatarUrl}
            size="md"
            className="ring-1 ring-white/20"
          />
          <div>
            <h3 className="font-sm text-white">{otherUserProfile.username}</h3>
            <p className="text-xs text-white/60">
              {otherUserProfile.bio
                ? otherUserProfile.bio.length > 50
                  ? `${otherUserProfile.bio.substring(0, 50)}...`
                  : otherUserProfile.bio
                : `${otherUserProfile.rank && `${otherUserProfile.rank} • `}${otherUserProfile.wins}W ${otherUserProfile.losses}L`
              }
            </p>
          </div>
        </div>

        {/* Retention notice */}
        <div className="px-4 py-2 border-b border-white/10 bg-gray-900/30">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span>Messages older than 7 days are automatically deleted.</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {messagesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white/40" />
                </div>
                <p className="text-white/60 mb-2">No messages yet</p>
                <p className="text-sm text-white/40">
                  Start the conversation with {otherUserProfile.username}!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {hasMoreOlder && (
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void loadOlderMessages()}
                    disabled={isFetchingOlder}
                    className="h-6 px-3 text-xs text-white/80 hover:text-white hover:bg-white/10"
                  >
                    {isFetchingOlder ? "Loading…" : "Load previous messages"}
                  </Button>
                </div>
              )}
              {messages.map((message: Message | OptimisticMessage, index) => {
                const isOptimistic = 'isOptimistic' in message;
                const isOwn = isOptimistic || message.senderId === currentUserProfile?.userId;
                
                // Determine message position for clustering
                const previousMessage = index > 0 ? messages[index - 1] : null;
                const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                
                // Check if we need time dividers
                const showTimeDividerBefore = needsTimeDivider(message, previousMessage);
                const showTimeDividerAfter = index < messages.length - 1 ? needsTimeDivider(messages[index + 1], message) : false;
                
                const messagePosition = getMessagePosition(message, previousMessage, nextMessage, showTimeDividerBefore, showTimeDividerAfter);
                
                return (
                  <div key={message._id}>
                    {showTimeDividerBefore && renderTimeDivider('isOptimistic' in message ? message._creationTime : message.timestamp)}
                    {renderMessage(message, isOwn, messagePosition, isOptimistic)}
                  </div>
                );
              })}
              {typingStatus?.isTyping && (
                <div className="flex gap-2 items-end mb-4 justify-start">
                  <div className="w-8 flex flex-col justify-start">
                    <UserAvatar
                      username={otherUserProfile.username}
                      avatarUrl={otherUserProfile.avatarUrl}
                      rank={otherUserProfile.rank}
                      size="sm"
                      className="mb-1"
                    />
                  </div>
                  <div className="max-w-[70%] items-start">
                    <div className="px-4 py-2 shadow-sm relative rounded-2xl rounded-bl-md bg-white/10 text-white">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                        <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-slate-900/50">
          <div className="flex gap-2">
            <Input
              placeholder={`Message ${otherUserProfile.username}...`}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                signalTyping();
              }}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
            />
            <Button
              onClick={() => void handleSendMessage()}
              disabled={!newMessage.trim() || isLoading}
              size="sm"
              variant='gradient'
              className="disabled:opacity-50 rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
