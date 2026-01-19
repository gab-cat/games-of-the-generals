import { useState, useEffect, type ReactNode } from "react";
import {
  Search,
  Plus,
  ArrowLeft,
  ExternalLink,
  Users,
  MessageCircle,
  MessageSquareText,
  Bell,
} from "lucide-react";
import { useConvexAuth, useMutation } from "convex/react";
import { useConvexQueryWithOptions } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { UserAvatar } from "../UserAvatar";
import { UserNameWithBadge } from "../UserNameWithBadge";
import { cn } from "../../lib/utils";
import { ConversationView } from "./ConversationView";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import {
  subscribeUserToPush,
  serializeSubscription,
} from "../../lib/push-client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { useOnlineUsers } from "../../lib/useOnlineUsers";
import {
  getStatusForUsername,
  getStatusIndicatorNode,
} from "../../lib/getIndicator";

interface MessagingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLobby?: (lobbyId: string) => void;
  onNavigateToGame?: (gameId: string) => void;
  inviteLobbyId?: string | null;
}

interface NewMessageViewProps {
  inviteLobbyId?: string | null;
  onSelectUser: (userId: string, username?: string) => void;
  shouldShowEnablePush: boolean;
  isSubscribing: boolean;
  onEnablePush: () => void;
  getOnlineStatusIndicator: (username: string) => ReactNode;
}

interface SearchResult {
  userId: string;
  username: string;
  avatarUrl?: string;
  rank?: string;
  avatarFrame?: string;
  usernameColor?: string;
  tier?: "free" | "pro" | "pro_plus";
  isDonor?: boolean;
}

function NewMessageView({
  inviteLobbyId,
  onSelectUser,
  shouldShowEnablePush,
  isSubscribing,
  onEnablePush,
  getOnlineStatusIndicator,
}: NewMessageViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  // Using online indicators from parent; logging handled at root

  // Helper function now comes from parent via props

  const { data: searchResults = [], isLoading: searchLoading } = useConvexQuery(
    api.messages.searchUsers,
    debouncedSearchTerm.length >= 2
      ? { searchTerm: debouncedSearchTerm }
      : "skip",
  );

  const { data: recentConversationsData } = useConvexQueryWithOptions(
    api.messages.getConversations,
    {},
    {
      staleTime: 60000, // 1 minute - conversations update moderately frequently
      gcTime: 300000, // 5 minutes cache
    },
  );

  // Extract conversations from paginated response
  const recentConversations = Array.isArray(recentConversationsData)
    ? recentConversationsData.slice(0, 5)
    : recentConversationsData?.page?.slice(0, 5) || [];

  const handleSelectUser = (userId: string, username: string) => {
    onSelectUser(userId, username);
    // Clear search after selection
    setSearchTerm("");
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Search */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
          <Input
            placeholder={
              inviteLobbyId ? "SEARCH_FOR_OPERATIVE..." : "SEARCH_USERNAME..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-mono text-sm h-10 transition-all font-medium"
            autoFocus
          />
        </div>
        {shouldShowEnablePush && (
          <Button
            disabled={isSubscribing}
            onClick={onEnablePush}
            className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-mono uppercase tracking-wider h-8"
          >
            Enable push uplink
          </Button>
        )}
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {searchLoading && debouncedSearchTerm.length >= 2 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
            <p className="text-zinc-500 text-xs font-mono ml-3 uppercase tracking-wider">
              Scanning Database...
            </p>
          </div>
        ) : debouncedSearchTerm.length < 2 ? (
          <div className="space-y-4">
            {/* Recent Conversations */}
            {recentConversations.length > 0 && (
              <div className="space-y-2">
                <div className="px-4 py-2 border-b border-white/5">
                  <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                    Recent Comms
                  </h3>
                </div>
                <div className="space-y-px px-2">
                  {recentConversations.map((conversation: any) => (
                    <div
                      key={conversation._id}
                      onClick={() =>
                        handleSelectUser(
                          conversation.otherParticipant.id,
                          conversation.otherParticipant.username,
                        )
                      }
                      className="flex items-center gap-3 p-3 rounded-sm border-l-2 border-transparent hover:border-amber-500 hover:bg-zinc-900/50 cursor-pointer transition-all"
                    >
                      <div className="relative">
                        {conversation.otherParticipant.username ===
                        "Notifications" ? (
                          <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Bell className="w-5 h-5 text-blue-400" />
                          </div>
                        ) : (
                          <UserAvatar
                            username={conversation.otherParticipant.username}
                            avatarUrl={conversation.otherParticipant.avatarUrl}
                            size="md"
                            frame={conversation.otherParticipant.avatarFrame}
                          />
                        )}
                        {/* Online status indicator - hide for Notifications */}
                        {conversation.otherParticipant.username !==
                          "Notifications" &&
                          getOnlineStatusIndicator(
                            conversation.otherParticipant.username,
                          ) && (
                            <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-0.5">
                              {getOnlineStatusIndicator(
                                conversation.otherParticipant.username,
                              )}
                            </div>
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <UserNameWithBadge
                          username={conversation.otherParticipant.username}
                          tier={conversation.otherParticipant.tier}
                          isDonor={conversation.otherParticipant.isDonor}
                          usernameColor={
                            conversation.otherParticipant.usernameColor
                          }
                          size="sm"
                        />
                        {conversation.otherParticipant.rank && (
                          <p className="text-xs text-zinc-500 font-mono">
                            {conversation.otherParticipant.rank}
                          </p>
                        )}
                      </div>
                      <div className="text-[10px] uppercase font-mono text-zinc-600 tracking-wider">
                        {inviteLobbyId ? "Invite" : "Message"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Instructions */}
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-900/50 flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Search className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-400 mb-2 font-display tracking-wide">
                  SEARCH DATABASE
                </p>
                <p className="text-xs text-zinc-600 font-mono uppercase tracking-wider max-w-[200px] mx-auto">
                  Type at least 2 characters to locate personnel
                </p>
              </div>
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-900/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <Search className="w-8 h-8 text-red-500/50" />
              </div>
              <p className="text-zinc-400 mb-2 font-display tracking-wide">
                NO MATCHES FOUND
              </p>
              <p className="text-xs text-zinc-600 font-mono uppercase tracking-wider">
                Verify username parameters
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-px p-2">
            {searchResults.map((user: SearchResult) => (
              <div
                key={user.userId}
                onClick={() => handleSelectUser(user.userId, user.username)}
                className="flex items-center gap-3 p-3 rounded-sm border-l-2 border-transparent hover:border-amber-500 hover:bg-zinc-900/50 cursor-pointer transition-all"
              >
                <div className="relative">
                  <UserAvatar
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                    size="md"
                    frame={user.avatarFrame}
                  />
                  {/* Online status indicator */}
                  {getOnlineStatusIndicator(user.username) && (
                    <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-0.5">
                      {getOnlineStatusIndicator(user.username)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <UserNameWithBadge
                    username={user.username}
                    tier={user.tier}
                    isDonor={user.isDonor}
                    usernameColor={user.usernameColor}
                    size="sm"
                  />
                  {user.rank && (
                    <p className="text-xs text-zinc-500 font-mono">
                      {user.rank}
                    </p>
                  )}
                </div>
                <div className="text-[10px] uppercase font-mono text-zinc-600 tracking-wider">
                  {inviteLobbyId ? "Invite" : "Message"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MessagingPanel({
  isOpen,
  onClose,
  onNavigateToLobby,
  onNavigateToGame,
  inviteLobbyId,
}: MessagingPanelProps) {
  const { isAuthenticated } = useConvexAuth();
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isMobile, setIsMobile] = useState(false);
  const [localEndpoint, setLocalEndpoint] = useState<string | null>(null);
  const [hasLocalSubscription, setHasLocalSubscription] = useState(false);

  // Get online users data at root
  const { onlineUsers } = useOnlineUsers();

  // Shared helper at root used by both list and NewMessageView
  const getOnlineStatusIndicator = (username: string) => {
    const status = getStatusForUsername(onlineUsers, username);
    return getStatusIndicatorNode(status);
  };

  // Debounce search term to avoid too many queries
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedConversation(null);
      setSearchTerm("");
      setShowNewMessage(false); // Reset to show conversations by default
    }
  }, [isOpen]);

  // Handle lobby invite - only set to new message if we have an invite
  useEffect(() => {
    if (inviteLobbyId && isOpen) {
      setShowNewMessage(true);
      setSelectedConversation(null);
    } else if (isOpen && !inviteLobbyId) {
      // If opening without invite, show conversations
      setShowNewMessage(false);
    }
  }, [inviteLobbyId, isOpen]);

  const { data: conversationsData, isLoading: conversationsLoading } =
    useConvexQueryWithOptions(
      api.messages.getConversations,
      {},
      {
        staleTime: 30000, // 30 seconds - conversations need moderate freshness
        gcTime: 300000, // 5 minutes cache
      },
    );

  // Extract conversations from paginated response
  const conversations = Array.isArray(conversationsData)
    ? conversationsData
    : conversationsData?.page || [];

  const { data: unreadCount = 0 } = useConvexQueryWithOptions(
    api.messages.getUnreadCount,
    {},
    {
      staleTime: 10000, // 10 seconds - unread count should be fresh
      gcTime: 60000, // 1 minute cache
    },
  );

  const { data: existingSubs } = useConvexQuery(
    api.push.getSubscriptionsForCurrentUser,
    isAuthenticated ? {} : "skip",
  );

  const { data: currentProfile } = useConvexQuery(
    api.profiles.getCurrentProfile,
    isAuthenticated ? {} : "skip",
  );

  const saveSubscription = useMutation(api.push.saveSubscription);

  const sendMessage = useMutation(api.messages.sendMessage);

  // Filter conversations based on debounced search term
  const filteredConversations = conversations.filter((conv: any) =>
    conv.otherParticipant.username
      .toLowerCase()
      .includes(debouncedSearchTerm.toLowerCase()),
  );

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return new Date(timestamp).toLocaleDateString();
  };

  const truncateMessage = (message: string, maxLength = 40) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  // Setup env and mobile detection
  useEffect(() => {
    setVapidKey(import.meta.env.VITE_VAPID_PUBLIC_KEY || null);
    if (typeof window !== "undefined" && "matchMedia" in window) {
      const mq = window.matchMedia("(max-width: 768px)");
      const update = () => setIsMobile(mq.matches);
      update();
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
  }, []);

  // Check local push subscription
  useEffect(() => {
    void (async () => {
      try {
        if (!("serviceWorker" in navigator)) return;
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        const endpoint = sub?.endpoint || null;
        setLocalEndpoint(endpoint);
        setHasLocalSubscription(Boolean(sub));
      } catch {
        setLocalEndpoint(null);
        setHasLocalSubscription(false);
      }
    })();
  }, [isOpen]);

  const isLocalEndpointSaved = Boolean(
    localEndpoint &&
      existingSubs?.some((s: any) => s.endpoint === localEndpoint),
  );

  const supportsPush =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator;

  const [shouldShowEnablePush, setShouldShowEnablePush] = useState(false);

  // Update shouldShowEnablePush based on current conditions
  useEffect(() => {
    if (isAuthenticated && supportsPush && !isLocalEndpointSaved) {
      setShouldShowEnablePush(true);
    } else {
      setShouldShowEnablePush(false);
    }
  }, [isAuthenticated, supportsPush, isLocalEndpointSaved]);

  const handleEnablePush = async () => {
    try {
      setIsSubscribing(true);
      // If we already have a local subscription but it's not saved, just save it
      if (hasLocalSubscription && localEndpoint && !isLocalEndpointSaved) {
        const reg = await navigator.serviceWorker.getRegistration();
        const existing = await reg?.pushManager.getSubscription();
        if (existing) {
          await saveSubscription({
            subscription: serializeSubscription(existing),
          });
          toast.success("Push notifications enabled on this device");
          setShouldShowEnablePush(false);
          return;
        }
      }
      if (!vapidKey) {
        toast.error("Push is not configured");
        return;
      }
      const sub = await subscribeUserToPush(vapidKey);
      if (!sub) {
        toast.error("Permission denied or subscription failed");
        return;
      }
      await saveSubscription({ subscription: serializeSubscription(sub) });
      toast.success("Push notifications enabled on this device");
      setShouldShowEnablePush(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to enable push");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isAuthenticated) return null;

  const handleUserSelect = (userId: string, username?: string) => {
    if (inviteLobbyId) {
      // Handle lobby invite - we need to get the username first
      const conversation = conversations.find(
        (c: any) => c.otherParticipant.id === userId,
      );
      const recipientUsername =
        username || conversation?.otherParticipant.username;

      if (recipientUsername) {
        sendMessage({
          recipientUsername,
          content: `Join my lobby!`,
          messageType: "lobby_invite",
          lobbyId: inviteLobbyId as Id<"lobbies">,
        })
          .then(() => {
            toast.success("Lobby invite sent!");
            setShowNewMessage(false);
            onClose(); // Close the messaging panel after sending invite
          })
          .catch((error: any) => {
            console.error("Failed to send lobby invite:", error);
            toast.error("Failed to send lobby invite");
          });
      }
    } else {
      // For regular messages, open the conversation
      setSelectedConversation(userId);
      setShowNewMessage(false);
    }
  };

  const handleNewMessage = () => {
    setShowNewMessage(true);
    setSelectedConversation(null);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-full max-w-md p-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none bg-zinc-950 border-l border-white/10 text-white shadow-2xl"
          tabIndex={-1}
        >
          <SheetHeader
            className={cn(
              "p-4 border-b border-white/10 bg-zinc-900/50 backdrop-blur-sm",
              selectedConversation && "hidden", // Hide header when in conversation view
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <MessageSquareText className="w-4 h-4 text-amber-500" />
                </div>
                {showNewMessage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewMessage(false)}
                    className="p-2 h-8 w-8 rounded hover:bg-white/10"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                ) : null}
                <div className="flex flex-col items-start">
                  <SheetTitle className="text-lg font-display font-medium tracking-wide text-white uppercase">
                    {showNewMessage ? "New Transmission" : "Comms Relay"}
                  </SheetTitle>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    {showNewMessage ? "Select Recipient" : "Active Channels"}
                  </span>
                </div>
                {!showNewMessage && unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="bg-red-500/20 text-red-400 border border-red-500/50 font-mono text-xs ml-2"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </div>

              <div className="flex items-center mr-8 gap-1">
                {!showNewMessage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewMessage}
                    className="h-8 px-3 text-xs font-mono uppercase tracking-wider text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20"
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    New
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <div
            className={cn(
              "flex-1 overflow-hidden bg-zinc-950",
              selectedConversation ? "h-full" : "h-[calc(100vh-80px)]",
            )}
          >
            {selectedConversation ? (
              <ConversationView
                otherUserId={selectedConversation}
                onNavigateToLobby={onNavigateToLobby}
                onNavigateToGame={onNavigateToGame}
                onBack={() => setSelectedConversation(null)}
                onNavigateToTicket={() => onClose()}
              />
            ) : showNewMessage ? (
              <NewMessageView
                inviteLobbyId={inviteLobbyId}
                onSelectUser={handleUserSelect}
                shouldShowEnablePush={shouldShowEnablePush}
                isSubscribing={isSubscribing}
                onEnablePush={() => void handleEnablePush()}
                getOnlineStatusIndicator={getOnlineStatusIndicator}
              />
            ) : (
              <div className="h-full flex flex-col">
                {/* Search */}
                <div className="p-4 space-y-3 border-b border-white/5">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                    <Input
                      placeholder="SEARCH_CHANNELS..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-mono text-sm h-10 transition-all font-medium"
                    />
                  </div>
                  {shouldShowEnablePush && (
                    <Button
                      disabled={isSubscribing}
                      onClick={() => void handleEnablePush()}
                      className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-mono uppercase tracking-wider h-8"
                    >
                      Enable push uplink
                    </Button>
                  )}
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                  {conversationsLoading ? (
                    <div className="p-4 space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-sm border border-white/5 bg-zinc-900/20 animate-pulse"
                        >
                          <div className="w-10 h-10 rounded bg-white/5" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-white/5 rounded w-24" />
                            <div className="h-2 bg-white/5 rounded w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-zinc-900/50 flex items-center justify-center mx-auto mb-4 border border-white/5">
                          <MessageCircle className="w-8 h-8 text-zinc-600" />
                        </div>
                        <p className="text-zinc-400 mb-2 font-display tracking-wide">
                          {debouncedSearchTerm
                            ? "NO CHANNELS FOUND"
                            : "NO TRANSMISSIONS"}
                        </p>
                        <p className="text-xs font-mono text-zinc-600 mb-6">
                          {debouncedSearchTerm
                            ? "REVISE SEARCH PARAMETERS"
                            : "INITIALIZE NEW COMMUNICATION UPLINK"}
                        </p>
                        {!debouncedSearchTerm && (
                          <Button
                            onClick={handleNewMessage}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs uppercase tracking-wider"
                          >
                            <Plus className="w-3 h-3 mr-2" />
                            Initialize
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-px">
                      {filteredConversations.map((conversation: any) => (
                        <div
                          key={conversation._id}
                          onClick={() =>
                            setSelectedConversation(
                              conversation.otherParticipant.id,
                            )
                          }
                          className={cn(
                            "flex items-center gap-4 px-4 py-4 cursor-pointer transition-all border-l-2",
                            "hover:bg-zinc-900/50",
                            conversation.unreadCount > 0
                              ? "bg-zinc-900/30 border-amber-500"
                              : "bg-transparent border-transparent hover:border-zinc-700",
                          )}
                        >
                          <div className="relative">
                            {conversation.otherParticipant.username ===
                            "Notifications" ? (
                              <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Bell className="w-5 h-5 text-blue-400" />
                              </div>
                            ) : (
                              <UserAvatar
                                username={
                                  conversation.otherParticipant.username
                                }
                                avatarUrl={
                                  conversation.otherParticipant.avatarUrl
                                }
                                size="md"
                                frame={
                                  conversation.otherParticipant.avatarFrame
                                }
                              />
                            )}
                            {/* Online status indicator - hide for Notifications */}
                            {conversation.otherParticipant.username !==
                              "Notifications" &&
                              getOnlineStatusIndicator(
                                conversation.otherParticipant.username,
                              ) && (
                                <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-0.5">
                                  {getOnlineStatusIndicator(
                                    conversation.otherParticipant.username,
                                  )}
                                </div>
                              )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <UserNameWithBadge
                                username={
                                  conversation.otherParticipant.username
                                }
                                tier={conversation.otherParticipant.tier}
                                isDonor={conversation.otherParticipant.isDonor}
                                usernameColor={
                                  conversation.otherParticipant.usernameColor
                                }
                                size="sm"
                                className={cn(
                                  conversation.unreadCount > 0 && "font-medium",
                                )}
                              />
                              <span className="text-[10px] font-mono text-zinc-500 flex-shrink-0 uppercase">
                                {formatTime(conversation.lastMessageAt)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  "text-xs truncate flex-1 font-mono",
                                  conversation.unreadCount > 0
                                    ? "text-zinc-300"
                                    : "text-zinc-500",
                                )}
                              >
                                {conversation.lastMessage ? (
                                  <>
                                    {conversation.lastMessage.messageType ===
                                      "lobby_invite" && (
                                      <span className="inline-flex items-center gap-1 text-blue-400">
                                        <Users className="w-3 h-3" />
                                        INVITE_PROTOCOL_RECEIVED
                                      </span>
                                    )}
                                    {conversation.lastMessage.messageType ===
                                      "game_invite" && (
                                      <span className="inline-flex items-center gap-1 text-amber-400">
                                        <ExternalLink className="w-3 h-3" />
                                        GAME_UPLINK_RECEIVED
                                      </span>
                                    )}
                                    {conversation.lastMessage.messageType ===
                                      "text" && (
                                      <>
                                        {currentProfile &&
                                          conversation.lastMessage.senderId ===
                                            currentProfile.userId &&
                                          conversation.otherParticipant
                                            .username !== "Notifications" && (
                                            <span className="text-zinc-600 mr-1">
                                              YOU:
                                            </span>
                                          )}
                                        {truncateMessage(
                                          conversation.lastMessage.content,
                                        )}
                                      </>
                                    )}
                                  </>
                                ) : (
                                  "NO_DATA"
                                )}
                              </p>

                              {conversation.unreadCount > 0 && (
                                <Badge
                                  variant="default"
                                  className="bg-amber-500 text-black border-none rounded-sm min-w-[18px] h-4 text-[9px] font-mono font-bold flex items-center justify-center"
                                >
                                  {conversation.unreadCount > 9
                                    ? "9+"
                                    : conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
