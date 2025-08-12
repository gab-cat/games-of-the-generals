import { useState, useEffect } from "react";
import { Search, Plus, ArrowLeft, ExternalLink, Users, MessageCircle, MessageSquareText } from "lucide-react";
import { useConvexAuth, useMutation } from "convex/react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { UserAvatar } from "../UserAvatar";
import { cn } from "../../lib/utils";
import { ConversationView } from "./ConversationView";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { subscribeUserToPush, serializeSubscription } from "../../lib/push-client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

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
}

interface SearchResult {
  userId: string;
  username: string;
  avatarUrl?: string;
  rank?: string;
}

function NewMessageView({ inviteLobbyId, onSelectUser, shouldShowEnablePush, isSubscribing, onEnablePush }: NewMessageViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const { data: searchResults = [], isLoading: searchLoading } = useConvexQuery(
    api.messages.searchUsers,
    debouncedSearchTerm.length >= 2 ? { searchTerm: debouncedSearchTerm } : "skip"
  );

  const { data: recentConversationsData } = useConvexQuery(
    api.messages.getConversations,
    {} // Get recent conversations for suggestions
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
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
          <Input
            placeholder={inviteLobbyId ? "Search for player to invite..." : "Search by username..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
            autoFocus
          />
        </div>
        {shouldShowEnablePush && (
          <Button
            disabled={isSubscribing}
            onClick={onEnablePush}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Enable push notifications on this device
          </Button>
        )}
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {searchLoading && debouncedSearchTerm.length >= 2 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <p className="text-white/60 text-sm ml-3">Searching...</p>
          </div>
        ) : debouncedSearchTerm.length < 2 ? (
          <div className="space-y-4">
            {/* Recent Conversations */}
            {recentConversations.length > 0 && (
              <div className="space-y-2">
                <div className="px-4 py-2">
                  <h3 className="text-sm font-medium text-white/80">Recent Conversations</h3>
                </div>
                <div className="space-y-1 px-2">
                  {recentConversations.map((conversation: any) => (
                    <div
                      key={conversation._id}
                      onClick={() => handleSelectUser(conversation.otherParticipant.id, conversation.otherParticipant.username)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <UserAvatar
                        username={conversation.otherParticipant.username}
                        avatarUrl={conversation.otherParticipant.avatarUrl}
                        size="md"
                        className="ring-1 ring-white/20"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">
                          {conversation.otherParticipant.username}
                        </h3>
                        {conversation.otherParticipant.rank && (
                          <p className="text-sm text-white/60">
                            {conversation.otherParticipant.rank}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-white/40">
                        {inviteLobbyId ? "Invite" : "Message"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Search Instructions */}
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 mb-2">Search for more players</p>
                <p className="text-sm text-white/40">
                  Type at least 2 characters to search for players to {inviteLobbyId ? "invite" : "message"}
                </p>
              </div>
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Search className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-2">No players found</p>
              <p className="text-sm text-white/40">
                Try a different username
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {searchResults.map((user: SearchResult) => (
              <div
                key={user.userId}
                onClick={() => handleSelectUser(user.userId, user.username)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              >
                <UserAvatar
                  username={user.username}
                  avatarUrl={user.avatarUrl}
                  size="md"
                  className="ring-1 ring-white/20"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">
                    {user.username}
                  </h3>
                  {user.rank && (
                    <p className="text-sm text-white/60">
                      {user.rank}
                    </p>
                  )}
                </div>
                <div className="text-xs text-white/40">
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
  inviteLobbyId 
}: MessagingPanelProps) {
  const { isAuthenticated } = useConvexAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [localEndpoint, setLocalEndpoint] = useState<string | null>(null);
  const [hasLocalSubscription, setHasLocalSubscription] = useState(false);
  
  
  // Debounce search term to avoid too many queries
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

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

  const { data: conversationsData, isLoading: conversationsLoading } = useConvexQuery(
    api.messages.getConversations,
    isAuthenticated ? {} : "skip"
  );

  // Extract conversations from paginated response  
  const conversations = Array.isArray(conversationsData) ? conversationsData : conversationsData?.page || [];

  const { data: unreadCount = 0 } = useConvexQuery(
    api.messages.getUnreadCount,
    isAuthenticated ? {} : "skip"
  );

  const { data: existingSubs } = useConvexQuery(
    api.push.getSubscriptionsForCurrentUser,
    isAuthenticated ? {} : "skip"
  );

  const saveSubscription = useMutation(api.push.saveSubscription);

  const sendMessage = useMutation(api.messages.sendMessage);

  // Filter conversations based on debounced search term
  const filteredConversations = conversations.filter((conv: any) =>
    conv.otherParticipant.username.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
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
    localEndpoint && existingSubs?.some((s: any) => s.endpoint === localEndpoint)
  );

  const supportsPush = typeof window !== "undefined"
    && "Notification" in window
    && "serviceWorker" in navigator;

  const [shouldShowEnablePush, setShouldShowEnablePush] = useState(isMobile && supportsPush && isAuthenticated && !isLocalEndpointSaved);

  const handleEnablePush = async () => {
    try {
      setIsSubscribing(true);
      // If we already have a local subscription but it's not saved, just save it
      if (hasLocalSubscription && localEndpoint && !isLocalEndpointSaved) {
        const reg = await navigator.serviceWorker.getRegistration();
        const existing = await reg?.pushManager.getSubscription();
        if (existing) {
          await saveSubscription({ subscription: serializeSubscription(existing) });
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
      const conversation = conversations.find((c: any) => c.otherParticipant.id === userId);
      const recipientUsername = username || conversation?.otherParticipant.username;
      
      if (recipientUsername) {
        sendMessage({
          recipientUsername,
          content: `Join my lobby!`,
          messageType: "lobby_invite",
          lobbyId: inviteLobbyId as Id<"lobbies">,
        }).then(() => {
          toast.success("Lobby invite sent!");
          setShowNewMessage(false);
          onClose(); // Close the messaging panel after sending invite
        }).catch((error: any) => {
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
      <Sheet open={isOpen} onOpenChange={onClose} >
        <SheetContent 
          side="right" 
          className="w-full max-w-md p-0 bg-gray-700/20 backdrop-blur-xl border-white/20 text-white"
        >
          <SheetHeader className={cn(
            "p-4 border-b border-white/20 bg-gray-900/40",
            selectedConversation && "hidden" // Hide header when in conversation view
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquareText className="w-6 h-6 text-white/80" />
                {showNewMessage ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowNewMessage(false)}
                    className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                ) : null}
                <SheetTitle className="text-lg font-semibold text-white">
                  {showNewMessage ? "New Message" : "Messages"}
                </SheetTitle>
                {!showNewMessage && unreadCount > 0 && (
                  <Badge variant="destructive" className="bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center mr-8 gap-1">
                {!showNewMessage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleNewMessage}
                    className="p-2 text-white/80 rounded-full hover:text-white hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="">New Message</span>
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className={cn(
            "flex-1 overflow-hidden",
            selectedConversation ? "h-full" : "h-[calc(100vh-80px)]"
          )}>
            {selectedConversation ? (
              <ConversationView
                otherUserId={selectedConversation}
                onNavigateToLobby={onNavigateToLobby}
                onNavigateToGame={onNavigateToGame}
                onBack={() => setSelectedConversation(null)}
              />
            ) : showNewMessage ? (
              <NewMessageView
                inviteLobbyId={inviteLobbyId}
                onSelectUser={handleUserSelect}
                shouldShowEnablePush={shouldShowEnablePush}
                isSubscribing={isSubscribing}
                onEnablePush={() => void handleEnablePush()}
              />
            ) : (
              <div className="h-full flex flex-col">
                {/* Search */}
                <div className="p-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                    />
                  </div>
                  {shouldShowEnablePush && (
                    <Button
                      disabled={isSubscribing}
                      onClick={() => void handleEnablePush()}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Enable push notifications on this device
                    </Button>
                  )}
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                  {conversationsLoading ? (
                    <div className="p-4 space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 animate-pulse">
                          <div className="w-12 h-12 rounded-full bg-white/10" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/10 rounded w-24" />
                            <div className="h-3 bg-white/10 rounded w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-8">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
                        <p className="text-white/60 mb-2">
                          {debouncedSearchTerm ? "No conversations found" : "No messages yet"}
                        </p>
                        <p className="text-sm text-white/40 mb-4">
                          {debouncedSearchTerm ? "Try a different search term" : "Start a conversation with other players"}
                        </p>
                        {!debouncedSearchTerm && (
                          <Button
                            onClick={handleNewMessage}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            New Message
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredConversations.map((conversation: any) => (
                        <div
                          key={conversation._id}
                          onClick={() => setSelectedConversation(conversation.otherParticipant.id)}
                          className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                        >
                          <div className="relative">
                            <UserAvatar
                              username={conversation.otherParticipant.username}
                              avatarUrl={conversation.otherParticipant.avatarUrl}
                              size="md"
                              className="ring-1 ring-white/20"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={cn(
                                "font-normal truncate text-sm",
                                conversation.unreadCount > 0 ? "text-white font-medium" : "text-white/80"
                              )}>
                                {conversation.otherParticipant.username}
                              </h3>
                              <span className="text-xs text-white/50 flex-shrink-0">
                                {formatTime(conversation.lastMessageAt)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "text-xs truncate flex-1",
                                conversation.unreadCount > 0 ? "text-white/90" : "text-white/60"
                              )}>
                                {conversation.lastMessage ? (
                                  <>
                                    {conversation.lastMessage.messageType === "lobby_invite" && (
                                      <span className="inline-flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Lobby invite: 
                                      </span>
                                    )}
                                    {conversation.lastMessage.messageType === "game_invite" && (
                                      <span className="inline-flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" />
                                        Game invite: 
                                      </span>
                                    )}
                                    {truncateMessage(conversation.lastMessage.content)}
                                  </>
                                ) : (
                                  "No messages yet"
                                )}
                              </p>
                              
                              {conversation.unreadCount > 0 && (
                                <Badge 
                                  variant="default" 
                                  className="bg-red-500 border-none rounded-full text-white min-w-[20px] h-5 text-xs flex items-center justify-center"
                                >
                                  {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
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
