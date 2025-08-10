import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, MessageCircle, Send } from "lucide-react";
import { useMutation } from "convex/react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UserAvatar } from "../UserAvatar";
import { cn } from "../../lib/utils";

interface FloatingChatProps {
  otherUserId: string;
  otherUsername: string;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

interface Message {
  _id: string;
  senderId: string;
  senderUsername: string;
  content: string;
  messageType: "text" | "lobby_invite" | "game_invite";
  timestamp: number;
  readAt?: number;
}

export function FloatingChat({ 
  otherUserId, 
  otherUsername, 
  onClose, 
  isMinimized, 
  onToggleMinimize 
}: FloatingChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);

  const { data: messages = [] } = useConvexQuery(
    api.messages.getConversationMessages,
    { otherUserId, limit: 20 }
  );

  const { data: otherUserProfile } = useConvexQuery(
    api.profiles.getProfileByUserId,
    { userId: otherUserId }
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (!isMinimized && messages.length > 0) {
      markAsRead({ otherUserId }).catch(console.error);
    }
  }, [isMinimized, messages.length, otherUserId, markAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setIsLoading(true);

    try {
      await sendMessage({
        recipientUsername: otherUsername,
        content: messageText,
        messageType: "text",
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setNewMessage(messageText); // Restore message on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const unreadMessages = messages.filter((msg: Message) => 
    !msg.readAt && msg.senderId === otherUserId
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-4 right-4 w-80 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-slate-900/50 border-b border-white/10">
        <div className="flex items-center gap-2">
          <UserAvatar
            username={otherUsername}
            avatarUrl={otherUserProfile?.avatarUrl}
            size="sm"
          />
          <div>
            <h3 className="text-sm font-medium text-white">{otherUsername}</h3>
            {unreadMessages.length > 0 && (
              <p className="text-xs text-blue-400">
                {unreadMessages.length} new message{unreadMessages.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="p-1 text-white/60 hover:text-white hover:bg-white/10"
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* Messages */}
            <div className="h-64 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-8 h-8 text-white/40 mx-auto mb-2" />
                    <p className="text-xs text-white/60">No messages yet</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message: Message) => {
                    const isOwn = message.senderId !== otherUserId;
                    return (
                      <div
                        key={message._id}
                        className={cn(
                          "flex gap-2 mb-2",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[70%] space-y-1",
                          isOwn ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "rounded-lg px-3 py-1.5 text-sm",
                            isOwn 
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-white/10 text-white rounded-bl-sm"
                          )}>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <p className={cn(
                            "text-xs text-white/50",
                            isOwn ? "text-right" : "text-left"
                          )}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-white/10 bg-slate-900/50">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1 h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                />
                <Button
                  onClick={() => void handleSendMessage()}
                  disabled={!newMessage.trim() || isLoading}
                  size="sm"
                  className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
