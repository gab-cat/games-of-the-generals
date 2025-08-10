import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Copy, ExternalLink, Users, CheckCheck, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { useMutation } from "convex/react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UserAvatar } from "../UserAvatar";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

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
      <div className="flex items-center gap-2 text-sm font-medium">
        <Users className="w-4 h-4" />
        Lobby Invitation
      </div>
      <p className="text-sm">{message.content}</p>
      {message.lobbyName && (
        <div className="text-sm opacity-90">
          <strong>{message.lobbyName}</strong>
        </div>
      )}
      
      {/* Lobby status and actions */}
      <div className="space-y-2">
        {lobbyInfo ? (
          <>
            {lobbyInfo.status === "waiting" ? (
              <div className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded">
                Lobby available • {lobbyInfo.playerId ? "2/2" : "1/2"} players
              </div>
            ) : lobbyInfo.status === "playing" ? (
              <div className="text-xs text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded">
                Match in progress
              </div>
            ) : lobbyInfo.status === "finished" ? (
              <div className="text-xs text-red-300 bg-red-500/20 px-2 py-1 rounded">
                Match finished • Cannot join
              </div>
            ) : (
              <div className="text-xs text-gray-300 bg-gray-500/20 px-2 py-1 rounded">
                Lobby closed
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              {message.lobbyCode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyLobbyCode(message.lobbyCode!)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Code
                </Button>
              )}
              {/* Only show join/view buttons for recipients (not senders) */}
              {!isOwnMessage && message.lobbyId && lobbyInfo?.status === "waiting" && onJoinLobby && (
                <Button
                  size="sm"
                  onClick={() => onJoinLobby(message.lobbyId!)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Join Lobby
                </Button>
              )}
              {!isOwnMessage && message.lobbyId && onNavigateToLobby && (lobbyInfo?.status === "playing" || lobbyInfo?.status === "finished") && (
                <Button
                  size="sm"
                  onClick={() => onNavigateToLobby(message.lobbyId!)}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={lobbyInfo.status === "finished"}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {lobbyInfo.status === "finished" ? "Match Ended" : "View Lobby"}
                </Button>
              )}
            </div>
          </>
        ) : message.lobbyId ? (
          <div className="text-xs text-gray-300 bg-gray-500/20 px-2 py-1 rounded">
            Loading lobby status...
          </div>
        ) : (
          <div className="flex gap-2 pt-2">
            {message.lobbyCode && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyLobbyCode(message.lobbyCode!)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Code
              </Button>
            )}
          </div>
        )}
      </div>
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

  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);
  const joinLobby = useMutation(api.lobbies.joinLobby);

  // Load messages with pagination support
  const { data: messagesData, isLoading: messagesLoading } = useConvexQuery(
    api.messages.getConversationMessages,
    { otherUserId }
  );

  // Extract messages from paginated response
  const serverMessages = messagesData?.page || [];

  // Merge server messages with optimistic messages
  const messages = [...serverMessages, ...optimisticMessages].sort((a, b) => {
    const aTime = 'timestamp' in a ? (a.timestamp ?? 0) : a._creationTime;
    const bTime = 'timestamp' in b ? (b.timestamp ?? 0) : b._creationTime;
    return aTime - bTime;
  });

  const { data: otherUserProfile } = useConvexQuery(
    api.profiles.getProfileByUserId,
    { userId: otherUserId }
  );

  const { data: currentUserProfile } = useConvexQuery(api.profiles.getCurrentProfile);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead({ otherUserId: otherUserId as Id<"users"> }).catch(console.error);
    }
  }, [messages.length, otherUserId, markAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage.trim();
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    
    // Create optimistic message
    const optimisticMessage: OptimisticMessage = {
      _id: optimisticId,
      content: messageText,
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
        content: messageText,
        messageType: "text",
      });
      
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

  const renderMessage = (message: Message | OptimisticMessage, isOwn: boolean, isOptimistic = false) => {
    return (
      <motion.div
        key={message._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex gap-2 mb-4",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        {!isOwn && (
          <UserAvatar
            username={message.senderUsername || otherUserProfile?.username || ""}
            avatarUrl={otherUserProfile?.avatarUrl}
            rank={otherUserProfile?.rank}
            size="sm"
            className="mt-1"
          />
        )}
        
        <div className={cn(
          "max-w-[70%] space-y-1",
          isOwn ? "items-end" : "items-start"
        )}>
          {/* Message bubble */}
          <div className={cn(
            "rounded-2xl px-4 py-2 shadow-sm",
            isOwn 
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-white/10 text-white rounded-bl-md",
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
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ExternalLink className="w-4 h-4" />
                  Game Invitation
                </div>
                <p className="text-sm">{message.content}</p>
                <div className="pt-2">
                  {message.gameId && onNavigateToGame && (
                    <Button
                      size="sm"
                      onClick={() => onNavigateToGame(message.gameId!)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Watch Game
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
          
          {/* Message metadata */}
          <div className={cn(
            "flex items-center gap-1 text-xs text-white/50",
            isOwn ? "justify-end" : "justify-start"
          )}>
            <span>{formatTime(('timestamp' in message ? message.timestamp : message._creationTime) || Date.now())}</span>
            {isOwn && !isOptimistic && (
              <div className="flex items-center">
                {message.readAt ? (
                  <CheckCheck className="w-3 h-3 text-blue-400" />
                ) : message.deliveredAt ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-yellow-400" />
                )}
              </div>
            )}
            {isOptimistic && 'status' in message && (
              <div className="flex items-center gap-1">
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
        </div>
        
        {isOwn && (
          <UserAvatar
            username={message.senderUsername || currentUserProfile?.username || ""}
            avatarUrl={currentUserProfile?.avatarUrl}
            rank={currentUserProfile?.rank}
            size="sm"
            className="mt-1"
          />
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
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-800/50 to-slate-900/50">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-slate-900/50">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10"
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
          <h3 className="font-medium text-white">{otherUserProfile.username}</h3>
          <p className="text-sm text-white/60">
            {otherUserProfile.rank && `${otherUserProfile.rank} • `}
            {otherUserProfile.wins}W {otherUserProfile.losses}L
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            {messages.map((message: Message | OptimisticMessage) => {
              const isOptimistic = 'isOptimistic' in message;
              const isOwn = isOptimistic || message.senderId === currentUserProfile?.userId;
              return renderMessage(message, isOwn, isOptimistic);
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/10 bg-slate-900/50">
        <div className="flex gap-2">
          <Input
            placeholder={`Message ${otherUserProfile.username}...`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
          />
          <Button
            onClick={() => void handleSendMessage()}
            disabled={!newMessage.trim() || isLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
