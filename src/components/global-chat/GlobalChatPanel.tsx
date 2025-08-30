"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Users, Settings, X, Send, ChevronUp, ChevronDown } from "lucide-react";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";
import { ChatMessage } from "./ChatMessage";
import { OnlineUsersList } from "./OnlineUsersList";
import { ChatRulesModal, ChatSettingsModal, MentionNotification, RateLimitModal, SpamWarningModal } from ".";
import { MentionInputWithDropdown } from "./MentionInputWithDropdown";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useChatProtection } from "../../lib/useChatProtection";
import { useMobile } from "../../lib/useMobile";

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
  const [showUsers, setShowUsers] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [commandResponse, setCommandResponse] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    closeSpamModal
  } = useChatProtection() as {
    validateMessage: (message: string) => { allowed: boolean; type?: 'rateLimit' | 'spam'; reason?: string };
    recordMessage: (message: string) => void;
    showRateLimitModal: boolean;
    showSpamModal: boolean;
    rateLimitState: { messageCount: number; isLimited: boolean; remainingTime: number };
    spamMessage: string;
    spamType: 'repeated' | 'caps' | 'excessive' | 'profanity' | 'generic';
    closeRateLimitModal: () => void;
    closeSpamModal: () => void;
  };

  // Queries - chat settings change infrequently
  const { data: chatSettings } = useConvexQueryWithOptions(
    api.globalChat.getUserChatSettings,
    {},
    {
      staleTime: 300000, // 5 minutes - chat settings don't change often
      gcTime: 600000, // 10 minutes cache
    }
  );

  const { data: messagesData } = useConvexQueryWithOptions(
    api.globalChat.getMessages,
    isOpen ? { limit: 20 } : "skip",
    {
      enabled: !!isOpen,
      staleTime: 30000, // 30 seconds - chat messages need moderate freshness
      gcTime: 300000, // 5 minutes cache
    }
  );

  const { messages: serverMessages = [] } = messagesData || {};

  // Use empty array if chat has been cleared, otherwise use server messages
  const messages = useMemo(() => {
    return chatHistory.includes('cleared') ? [] : serverMessages;
  }, [chatHistory, serverMessages]);

  const { data: onlineUsersData = [] } = useConvexQueryWithOptions(
    api.globalChat.getOnlineUsers,
    isOpen && showUsers ? {} : "skip",
    {
      enabled: !!(isOpen && showUsers),
      staleTime: 30000, // 30 seconds - online users need moderate freshness
      gcTime: 300000, // 5 minutes cache
    }
  );

  const onlineUsers = onlineUsersData?.filter((user: null): user is NonNullable<typeof user> => user !== null) || [];

  const { data: unreadMentionCount = 0 } = useConvexQueryWithOptions(
    api.globalChat.getUnreadMentionCount,
    isAuthenticated ? {} : "skip",
    {
      enabled: !!isAuthenticated,
      staleTime: 10000, // 10 seconds - unread count should be fresh
      gcTime: 60000, // 1 minute cache
    }
  );

  // Mutations
  const sendMessage = useMutation(api.globalChat.sendMessage);
  const markMentionsAsRead = useMutation(api.globalChat.markMentionsAsRead);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, optimisticMessages, isOpen, isMinimized]);

  // Mark mentions as read when panel opens
  useEffect(() => {
    if (isOpen && unreadMentionCount > 0) {
      void markMentionsAsRead();
    }
  }, [isOpen, unreadMentionCount, markMentionsAsRead]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Current user profile - profile data changes infrequently
  const { data: currentUser } = useConvexQueryWithOptions(
    api.profiles.getCurrentProfile,
    {},
    {
      staleTime: 120000, // 2 minutes - profile data changes infrequently
      gcTime: 600000, // 10 minutes cache
    }
  );

  const handleSendMessage = async () => {
    if (!message.trim() || !isAuthenticated || !currentUser) return;

    const messageText = message.trim();
    console.log('📤 Attempting to send message:', messageText);

    // Handle /clear command client-side
    if (messageText.toLowerCase() === '/clear') {
      // Clear chat history (client-side only)
      setChatHistory(['cleared']); // Mark as cleared
      setCommandResponse(null); // Clear any existing command response
      setMessage("");

      // Show confirmation in command response area
      setCommandResponse('*Chat history cleared (client-side only)*');
      return;
    }

    // Validate message with rate limiting and spam filtering
    const validation = validateMessage(messageText);
    console.log('📤 Validation result:', validation);

    if (!validation.allowed) {
      console.log('📤 Message blocked by validation');
      return; // Modal will be shown by the hook
    }

    console.log('📤 Message passed validation, sending to server');

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

    // Add optimistic message immediately
    setOptimisticMessages(prev => [...prev, optimisticMessage]);
    setMessage("");

    const result = await sendMessage({ message: messageText });

    if (result.success) {
      // Message sent successfully
      console.log('📤 Message sent successfully');

      // Record successful message for rate limiting and spam detection
      recordMessage(messageText);

      // Remove optimistic message after successful send
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));

      // Handle command responses
      if ('isSystemMessage' in result && result.isSystemMessage && 'commandResponse' in result) {
        // Show command response above the input (replaces any previous response)
        setCommandResponse(result.commandResponse);
      }
    } else {
      // Message failed to send
      const errorMessage = 'message' in result ? result.message : "Failed to send message";
      console.error("Failed to send message:", errorMessage);

      // Remove optimistic message on error
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));

      // Show error message
      toast.error(errorMessage || "Failed to send message");
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

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={isMobile ? { duration: 0.2 } : {
              type: "spring",
              stiffness: 400,
              damping: 35,
              opacity: { duration: 0.2 },
              y: { duration: 0.3 },
              scale: { duration: 0.2 }
            }}
            className="fixed bottom-4 right-4 z-50"
          >
            <motion.div
              layout={!isMobile}
              transition={isMobile ? { duration: 0.2 } : {
                type: "spring",
                stiffness: 500,
                damping: 40
              }}
              className={cn(
                "bg-gray-950/90 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl",
                "flex flex-col overflow-hidden",
                isMinimized ? "w-80 h-12" : "w-80 h-[600px]"
              )}
            >
              {/* Header */}
              <motion.div
                className="flex items-center justify-between p-3 border-b border-white/10 bg-gray-950/20 cursor-pointer hover:bg-gray-950/30 transition-colors duration-200"
                onClick={handleToggleMinimize}
                whileHover={isMobile ? undefined : { backgroundColor: "rgba(55, 65, 81, 0.3)" }}
                whileTap={isMobile ? undefined : { scale: 0.98 }}
                transition={isMobile ? { duration: 0.2 } : { duration: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={isMobile ? undefined : { rotate: isMinimized ? 180 : 0 }}
                    transition={isMobile ? { duration: 0.2 } : { duration: 0.4, ease: "easeInOut" }}
                  >
                    <MessageCircle className="w-5 h-5 text-white/70" />
                  </motion.div>
                  <span className="text-white/90 font-bold text-sm">Global Chat</span>
                  {unreadMentionCount > 0 && (
                    <motion.span
                      initial={isMobile ? undefined : { scale: 0 }}
                      animate={isMobile ? undefined : { scale: 1 }}
                      className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
                    >
                      {unreadMentionCount}
                    </motion.span>
                  )}
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUsers(!showUsers)}
                    className={cn(
                      "h-6 w-6 p-0 hover:text-white hover:bg-white/10",
                      showUsers ? "text-white bg-white/10" : "text-white/60"
                    )}
                  >
                    <Users className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowSettings}
                    className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleMinimize}
                    className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>

              {/* Content */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={isMobile ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={isMobile ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                    exit={isMobile ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={isMobile ? { duration: 0.2 } : {
                      type: "spring",
                      stiffness: 500,
                      damping: 45,
                      opacity: { duration: 0.2 },
                      height: { duration: 0.3 }
                    }}
                    className="flex-1 flex flex-col min-h-0 overflow-hidden"
                  >
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0 scroll-m-0 no-scrollbar">
                      {chatHistory.includes('cleared') ? (
                        <div className="text-center text-white/60 text-sm py-8">
                          Chat history cleared. New messages will appear here.
                        </div>
                      ) : (
                        [...optimisticMessages, ...messages].reverse().map((msg) => (
                          <ChatMessage
                            key={"_id" in msg ? msg._id : msg.id}
                            message={msg}
                            currentUserSettings={chatSettings}
                            isOptimistic={"isOptimistic" in msg}
                          />
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Command Response Area */}
                    {commandResponse && (
                      <div className="border-t border-white/10 bg-gray-900/50 text-xs no-scrollbar">
                        <div className="flex items-start justify-between p-3 no-scrollbar">
                          <div className="flex-1 max-h-32 text-xs overflow-y-auto mr-2 no-scrollbar">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 text-xs last:mb-0 leading-relaxed">{children}</p>,
                                strong: ({ children }) => <span className="font-semibold text-blue-200">{children}</span>,
                                ul: ({ children }) => <ul className="list-disc list-inside ml-4 mb-2 space-y-1">{children}</ul>,
                                li: ({ children }) => <li className="text-blue-300/90 text-xs">{children}</li>,
                                code: ({ children }) => (
                                  <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-xs font-mono text-blue-200">
                                    {children}
                                  </code>
                                ),
                                h1: ({ children }) => <h1 className="text-blue-200 text-base font-bold mb-2">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-blue-200 text-sm font-semibold mb-2">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-blue-200 text-xs font-semibold mb-1">{children}</h3>,
                              }}
                            >
                              {commandResponse}
                            </ReactMarkdown>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCommandResponse(null)}
                            className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                            title="Clear command response"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Input Area */}
                    <div className="p-2 border-t border-white/10 bg-black/10">
                      {!hasAgreedToRules ? (
                        <div className="text-center py-4">
                          <p className="text-white/60 text-sm mb-3">
                            You must agree to the chat rules before participating.
                          </p>
                          <Button
                            onClick={handleShowRules}
                            size="sm"
                            className="bg-white/10 hover:bg-white/20 text-white"
                          >
                            View Rules
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2 w-full justify-between items-center">
                            <MentionInputWithDropdown
                              handleSendMessage={() => void handleSendMessage()}
                              ref={inputRef}
                              value={message}
                              onChange={setMessage}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  void handleSendMessage();
                                }
                              }}
                              placeholder="Type a message... Use @ to mention users"
                              maxLength={500}
                            />
                            <Button
                              onClick={() => void handleSendMessage()}
                              disabled={!message.trim() || rateLimitState.isLimited}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Online Users Sidebar */}
            <AnimatePresence>
              {showUsers && !isMinimized && (
                <motion.div
                  initial={isMobile ? { opacity: 0 } : { opacity: 0, x: 20, scale: 0.95 }}
                  animate={isMobile ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
                  exit={isMobile ? { opacity: 0 } : { opacity: 0, x: 20, scale: 0.95 }}
                  transition={isMobile ? { duration: 0.2 } : {
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    opacity: { duration: 0.2 },
                    x: { duration: 0.3 },
                    scale: { duration: 0.2 }
                  }}
                  className="absolute bottom-0 right-80"
                >
                  <OnlineUsersList
                    users={onlineUsers}
                    onClose={() => setShowUsers(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>


          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ChatRulesModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        onAgree={() => {
          setShowRules(false);
          // Settings will be updated automatically via the mutation
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
