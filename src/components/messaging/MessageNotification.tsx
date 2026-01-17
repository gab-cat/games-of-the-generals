import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Users, ExternalLink } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { useQuery } from "convex-helpers/react/cache";
import { UserAvatar } from "../UserAvatar";

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
  isExiting?: boolean;
  senderAvatarFrame?: string;
  senderUsernameColor?: string;
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
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [_audioContextReady, setAudioContextReady] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioContextInitialized, setAudioContextInitialized] = useState<boolean>(false);
  const lastProcessedTimestampRef = useRef<number>(Date.now() - 5 * 60 * 1000);
  const stableTimestamp = useRef<number>(Date.now() - 5 * 60 * 1000);
  
  // Get unread count for title updates - unread count needs to be more current
  const unreadCount = useQuery(api.messages.getUnreadCount, {}) ?? 0;

  // Get recent unread messages to detect new messages - use a stable timestamp to avoid infinite re-queries
  const recentUnreadMessages = useQuery(api.messages.getRecentUnreadMessages, {
    sinceTimestamp: stableTimestamp.current,
    limit: 10 
  });

  // Initialize audio context immediately (will be suspended until user interaction)
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current && !audioContextInitialized) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContextInitialized(true);
      } catch (error) {
        console.warn("Could not create AudioContext:", error);
      }
    }
  }, [audioContextInitialized]);

  // Resume audio context on user interaction
  const resumeAudioContext = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        setAudioContextReady(true);
      } catch (error) {
        console.warn("Could not resume AudioContext:", error);
      }
    } else if (audioContextRef.current && audioContextRef.current.state === 'running') {
      setAudioContextReady(true);
    }
  }, []);

  // Request notification permission on mount and initialize audio context
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

    // Initialize audio context immediately (will be suspended)
    initializeAudioContext();

    // Set up audio context resumption on first user interaction
    const handleUserInteraction = () => {
      void resumeAudioContext();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [initializeAudioContext, resumeAudioContext]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
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
  const playNotificationSound = useCallback(async () => {
    if (!audioContextRef.current) {
      console.warn("AudioContext not initialized, skipping sound");
      return;
    }

    try {
      const audioContext = audioContextRef.current;
      
      // Resume the audio context if it's suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        setAudioContextReady(true);
      }
      
      // Check if audio context is ready to play
      if (audioContext.state !== 'running') {
        console.warn("AudioContext not running, current state:", audioContext.state);
        return;
      }
      
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
    const currentUnreadCount = unreadCount ?? 0;
    
    if (currentUnreadCount > 0) {
      document.title = `(${currentUnreadCount}) ${originalTitle}`;
      
      // Add favicon badge effect by updating the favicon
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon && currentUnreadCount > 0) {
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

  // OPTIMIZATION: Listen for new messages and show notifications
  // Uses stable timestamp + reactive queries instead of polling for better performance
  useEffect(() => {
    if (!isAuthenticated || !recentUnreadMessages || recentUnreadMessages.length === 0) return;
    
    // Filter messages that are actually new (newer than last processed timestamp)
    const newMessages: Message[] = recentUnreadMessages.filter(
      (message: any) => message.timestamp > lastProcessedTimestampRef.current
    );

    if (newMessages.length > 0) {
      // Update the last processed timestamp to the newest message
      const newestTimestamp = Math.max(...newMessages.map(msg => msg.timestamp));
      lastProcessedTimestampRef.current = newestTimestamp;

      setNotifications(prev => {
        // Only add messages that aren't already in notifications
        const existingIds = new Set(prev.map(n => n._id));
        const activeNotifications = prev.filter(n => !n.isExiting);
        const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg._id));
        
        // Show notifications and play sound for new messages only
        if (uniqueNewMessages.length > 0) {
          void playNotificationSound();
          
          // Show browser notifications for each new message
          uniqueNewMessages.forEach(showBrowserNotification);
        }
        
        return [...activeNotifications, ...uniqueNewMessages];
      });
    }
  }, [recentUnreadMessages, isAuthenticated, playNotificationSound, showBrowserNotification]);

  const removeNotification = (messageId: string) => {
    setNotifications(prev =>
      prev.map(n => n._id === messageId ? { ...n, isExiting: true } : n)
    );
    // Remove after animation completes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n._id !== messageId));
    }, 350); // Slightly longer than animation duration
  };



  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notifications.length === 0) return;

    const timers = notifications
      .filter(notification => !notification.isExiting)
      .map(notification => {
        return setTimeout(() => {
          setNotifications(prev =>
            prev.map(n => n._id === notification._id ? { ...n, isExiting: true } : n)
          );
          // Remove after animation completes
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n._id !== notification._id));
          }, 350);
        }, 5000); // 5 seconds
      });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications]);

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
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((message, index) => (
          <motion.div
            key={message._id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{
              opacity: { duration: 0.3 },
              x: { duration: 0.3 },
              scale: { duration: 0.3 },
              delay: index * 0.1
            }}
            className="bg-gray-950/80 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-4 min-w-80 max-w-sm"
          >
            <div className="flex items-start gap-3">
              {/* Message Icon/Avatar */}
              <div className="flex-shrink-0">
                {message.senderAvatarUrl ? (
                  <UserAvatar
                    username={message.senderUsername}
                    avatarUrl={message.senderAvatarUrl}
                    size="md"
                    frame={message.senderAvatarFrame}
                    className="ring-2 ring-green-500/20"
                  />
                ) : (
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    {getNotificationIcon(message.messageType)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-4 h-4 text-green-400" />
                  <span className="text-white/90 text-xs font-medium">
                    {getNotificationTitle(message.messageType)}
                  </span>
                </div>

                <p className="text-white/80 text-xs mb-2">
                  <span className="font-medium text-green-300">
                    {message.senderUsername}
                  </span>{" "}
                  sent you a message
                </p>

                <div className="bg-white/10 rounded-lg p-1 mb-3">
                  <p className="text-white/70 text-xs line-clamp-2">
                    {message.messageType === "lobby_invite" && message.lobbyName
                      ? `Invited you to lobby: ${message.lobbyName}`
                      : message.content}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-xs">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNotificationClick(message)}
                      className="h-6 px-2 text-xs text-green-300 hover:text-green-200 hover:bg-green-500/10"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Open
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNotification(message._id)}
                      className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
