import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Users, ExternalLink } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { useConvexQueryWithOptions } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { UserAvatar } from "../UserAvatar";
import { Button } from "../ui/button";

interface Message {
  _id: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl?: string;
  content: string;
  messageType: "text" | "lobby_invite" | "game_invite";
  timestamp: number;
  readAt?: number;
  lobbyId?: string;
  lobbyName?: string;
  gameId?: string;
}

interface MessageNotificationProps {
  onOpenMessaging?: () => void;
  onNavigateToLobby?: (lobbyId: string) => void;
  onNavigateToGame?: (gameId: string) => void;
}

export function MessageNotification({ 
  onOpenMessaging, 
  onNavigateToLobby, 
  onNavigateToGame 
}: MessageNotificationProps) {
  const { isAuthenticated } = useConvexAuth();
  const [notifications, setNotifications] = useState<Message[]>([]);
  const [lastChecked, setLastChecked] = useState<number>(Date.now());
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  
  // Get unread count for title updates - unread count needs to be more current
  const { data: unreadCount = 0 } = useConvexQueryWithOptions(
    api.messages.getUnreadCount,
    {},
    {
      staleTime: 10000, // 10 seconds - unread count should be relatively fresh
      gcTime: 60000, // 1 minute cache
    }
  );

  // Get recent conversations to detect new messages
  const { data: conversationsData } = useConvexQueryWithOptions(
    api.messages.getConversations,
    {},
    {
      staleTime: 30000, // 30 seconds - conversations need moderate freshness
      gcTime: 300000, // 5 minutes cache
    }
  );

  const conversations = useMemo(() => {
    return Array.isArray(conversationsData) 
      ? conversationsData 
      : conversationsData?.page || [];
  }, [conversationsData]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setHasPermission(true);
      } else if (Notification.permission !== "denied") {
        void Notification.requestPermission().then(permission => {
          setHasPermission(permission === "granted");
        });
      }
    }
  }, []);

  const handleNotificationClick = useCallback((message: Message) => {
    if (message.messageType === "lobby_invite" && message.lobbyId && onNavigateToLobby) {
      onNavigateToLobby(message.lobbyId);
    } else if (message.messageType === "game_invite" && message.gameId && onNavigateToGame) {
      onNavigateToGame(message.gameId);
    } else if (onOpenMessaging) {
      onOpenMessaging();
    }
    removeNotification(message._id);
  }, [onNavigateToLobby, onNavigateToGame, onOpenMessaging]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn("Could not play notification sound:", error);
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((message: Message) => {
    if (!hasPermission || document.visibilityState === "visible") return;

    const title = getNotificationTitle(message.messageType);
    const body = message.messageType === "lobby_invite" && message.lobbyName
      ? `${message.senderUsername} invited you to lobby: ${message.lobbyName}`
      : `${message.senderUsername}: ${message.content}`;

    try {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: message._id, // Prevent duplicate notifications
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        handleNotificationClick(message);
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.warn("Could not show browser notification:", error);
    }
  }, [hasPermission, handleNotificationClick]);

  // Update document title based on unread count
  useEffect(() => {
    const originalTitle = "Games of the Generals";
    
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${originalTitle}`;
      
      // Add favicon badge effect by updating the favicon
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon && unreadCount > 0) {
        // You could implement a dynamic favicon with a red dot here
        // For now, just ensure the title shows the count
      }
    } else {
      document.title = originalTitle;
    }

    // Cleanup on unmount
    return () => {
      document.title = originalTitle;
    };
  }, [unreadCount]);

  // Listen for new messages and show notifications
  useEffect(() => {
    if (!isAuthenticated || conversations.length === 0) return;

    const now = Date.now();
    const newMessages: Message[] = [];

    conversations.forEach((conversation: any) => {
      // Check if there's a new message since last check
      if (conversation.lastMessage && 
          conversation.lastMessage.timestamp > lastChecked &&
          !conversation.lastMessage.readAt &&
          conversation.unreadCount > 0) {
        
        // For notifications, we can use the otherParticipant data from the conversation
        // which already includes the avatar URL
        newMessages.push({
          _id: conversation.lastMessage._id,
          senderId: conversation.lastMessage.senderId,
          senderUsername: conversation.lastMessage.senderUsername,
          senderAvatarUrl: conversation.otherParticipant?.avatarUrl,
          content: conversation.lastMessage.content,
          messageType: conversation.lastMessage.messageType,
          timestamp: conversation.lastMessage.timestamp,
          readAt: conversation.lastMessage.readAt,
          lobbyId: conversation.lastMessage.lobbyId,
          lobbyName: conversation.lastMessage.lobbyName,
          gameId: conversation.lastMessage.gameId,
        });
      }
    });

    if (newMessages.length > 0) {
      setNotifications(prev => {
        // Only add messages that aren't already in notifications
        const existingIds = new Set(prev.map(n => n._id));
        const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg._id));
        
        // Show notifications and play sound for new messages
        if (uniqueNewMessages.length > 0) {
          playNotificationSound();
          
          // Show browser notifications for each new message
          uniqueNewMessages.forEach(showBrowserNotification);
        }
        
        return [...prev, ...uniqueNewMessages];
      });
    }

    setLastChecked(now);
  }, [conversations, lastChecked, isAuthenticated, playNotificationSound, showBrowserNotification, handleNotificationClick]);

  const removeNotification = (messageId: string) => {
    setNotifications(prev => prev.filter(n => n._id !== messageId));
  };

  const getNotificationIcon = (messageType: string) => {
    switch (messageType) {
      case "lobby_invite":
        return <Users className="w-4 h-4 text-blue-400" />;
      case "game_invite":
        return <ExternalLink className="w-4 h-4 text-green-400" />;
      default:
        return <MessageCircle className="w-4 h-4 text-white/80" />;
    }
  };

  const getNotificationTitle = (messageType: string) => {
    switch (messageType) {
      case "lobby_invite":
        return "Lobby Invitation";
      case "game_invite":
        return "Game Invitation";
      default:
        return "New Message";
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((message) => (
          <motion.div
            key={message._id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25 
            }}
            className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getNotificationIcon(message.messageType)}
                  <span className="text-sm font-medium text-white">
                    {getNotificationTitle(message.messageType)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNotification(message._id)}
                  className="p-1 h-6 w-6 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {/* Content */}
              <div 
                onClick={() => handleNotificationClick(message)}
                className="cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <UserAvatar
                    username={message.senderUsername}
                    avatarUrl={message.senderAvatarUrl}
                    size="sm"
                    className="ring-1 ring-white/20 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 mb-1">
                      {message.senderUsername}
                    </p>
                    <p className="text-sm text-white/70 line-clamp-2 group-hover:text-white/90 transition-colors">
                      {message.messageType === "lobby_invite" && message.lobbyName
                        ? `Invited you to lobby: ${message.lobbyName}`
                        : message.content}
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>

                {/* Action hint */}
                <div className="mt-3 text-xs text-white/40 text-center border-t border-white/10 pt-2">
                  Click to {message.messageType === "lobby_invite" ? "join lobby" : 
                           message.messageType === "game_invite" ? "watch game" : "view message"}
                </div>
              </div>
            </div>

            {/* Animated progress bar for auto-dismiss */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 8, ease: "linear" }}
              className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
              onAnimationComplete={() => removeNotification(message._id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
