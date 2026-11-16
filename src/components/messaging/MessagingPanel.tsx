import { useState, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Search, Plus, ArrowLeft, Eye, Users, Loader2 } from "lucide-react";
import { useConvexAuth, useMutation } from "convex/react";
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
import { fadeUp, stagger } from "../../lib/motion";
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
  pendingUserId: string | null;
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

const NOTIFICATIONS_NAME = "Notifications";

/** Avatar with the online/activity marker. The system "Notifications" thread shows the brand mark. */
function ParticipantAvatar({
  username,
  avatarUrl,
  frame,
  indicator,
}: {
  username: string;
  avatarUrl?: string;
  frame?: string;
  indicator?: ReactNode;
}) {
  return (
    <div className="relative shrink-0">
      {username === NOTIFICATIONS_NAME ? (
        <div className="flex size-10 items-center justify-center">
          <BrandMark className="size-8" />
        </div>
      ) : (
        <UserAvatar
          username={username}
          avatarUrl={avatarUrl}
          size="md"
          frame={frame}
        />
      )}
      {indicator ? (
        <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-0.5">
          {indicator}
        </div>
      ) : null}
    </div>
  );
}

function PushPrompt({
  isSubscribing,
  onEnablePush,
}: {
  isSubscribing: boolean;
  onEnablePush: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white/[0.03] p-3">
      <p className="text-sm text-foreground">
        Get an alert on this device when you get a message.
      </p>
      <Button
        size="sm"
        variant="secondary"
        disabled={isSubscribing}
        onClick={onEnablePush}
        className="shrink-0"
      >
        {isSubscribing ? (
          <>
            <Loader2 className="animate-spin" />
            Turning on
          </>
        ) : (
          "Turn on"
        )}
      </Button>
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="px-2 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-44 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NewMessageView({
  inviteLobbyId,
  onSelectUser,
  pendingUserId,
  shouldShowEnablePush,
  isSubscribing,
  onEnablePush,
  getOnlineStatusIndicator,
}: NewMessageViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

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

  // Extract conversations from paginated response; the system thread is not a person
  const recentConversations = (
    Array.isArray(recentConversationsData)
      ? recentConversationsData
      : recentConversationsData?.page || []
  )
    .filter((c: any) => c.otherParticipant.username !== NOTIFICATIONS_NAME)
    .slice(0, 5);

  const handleSelectUser = (userId: string, username: string) => {
    onSelectUser(userId, username);
    // Clear search after selection
    setSearchTerm("");
  };

  const actionLabel = inviteLobbyId ? "Invite" : "Message";
  const isSearching = debouncedSearchTerm.length >= 2;

  const renderRow = (
    key: string,
    person: {
      id: string;
      username: string;
      avatarUrl?: string;
      avatarFrame?: string;
      rank?: string;
      usernameColor?: string;
      tier?: "free" | "pro" | "pro_plus";
      isDonor?: boolean;
    },
  ) => {
    const isPending = pendingUserId === person.id;
    return (
      <motion.li key={key} variants={fadeUp}>
        <button
          type="button"
          disabled={pendingUserId !== null}
          onClick={() => handleSelectUser(person.id, person.username)}
          className="flex min-h-14 w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:bg-white/[0.1] disabled:opacity-60"
        >
          <ParticipantAvatar
            username={person.username}
            avatarUrl={person.avatarUrl}
            frame={person.avatarFrame}
            indicator={getOnlineStatusIndicator(person.username)}
          />
          <div className="min-w-0 flex-1">
            <UserNameWithBadge
              username={person.username}
              tier={person.tier}
              isDonor={person.isDonor}
              usernameColor={person.usernameColor}
              size="md"
            />
            {person.rank && (
              <p className="truncate text-xs text-foreground/75">
                {person.rank}
              </p>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-sm text-foreground/80">
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending
              </>
            ) : (
              actionLabel
            )}
          </span>
        </button>
      </motion.li>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-border p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
          <Input
            placeholder={
              inviteLobbyId
                ? "Search for a player to invite"
                : "Search players by username"
            }
            aria-label="Search players"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        {shouldShowEnablePush && (
          <PushPrompt
            isSubscribing={isSubscribing}
            onEnablePush={onEnablePush}
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isSearching && searchLoading ? (
          <ListSkeleton rows={4} />
        ) : !isSearching ? (
          <div className="p-2">
            {recentConversations.length > 0 ? (
              <>
                <h3 className="px-2 pb-1 pt-2 text-sm font-medium text-foreground">
                  Recent
                </h3>
                <motion.ul
                  variants={stagger(0.03)}
                  initial="hidden"
                  animate="show"
                >
                  {recentConversations.map((conversation: any) =>
                    renderRow(conversation._id, {
                      id: conversation.otherParticipant.id,
                      username: conversation.otherParticipant.username,
                      avatarUrl: conversation.otherParticipant.avatarUrl,
                      avatarFrame: conversation.otherParticipant.avatarFrame,
                      rank: conversation.otherParticipant.rank,
                      usernameColor:
                        conversation.otherParticipant.usernameColor,
                      tier: conversation.otherParticipant.tier,
                      isDonor: conversation.otherParticipant.isDonor,
                    }),
                  )}
                </motion.ul>
              </>
            ) : null}
            <p className="px-2 py-6 text-center text-sm text-foreground/80">
              Type at least 2 letters of a username.
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-foreground/80">
            No player found for "{debouncedSearchTerm}". Check the spelling.
          </p>
        ) : (
          <motion.ul
            variants={stagger(0.03)}
            initial="hidden"
            animate="show"
            className="p-2"
          >
            {searchResults.map((user: SearchResult) =>
              renderRow(user.userId, {
                id: user.userId,
                username: user.username,
                avatarUrl: user.avatarUrl,
                avatarFrame: user.avatarFrame,
                rank: user.rank,
                usernameColor: user.usernameColor,
                tier: user.tier,
                isDonor: user.isDonor,
              }),
            )}
          </motion.ul>
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
  const [localEndpoint, setLocalEndpoint] = useState<string | null>(null);
  const [hasLocalSubscription, setHasLocalSubscription] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // Get online users data at root
  const { onlineUsers } = useOnlineUsers(isOpen);

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

  // Setup env
  useEffect(() => {
    setVapidKey(import.meta.env.VITE_VAPID_PUBLIC_KEY || null);
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
          toast.success("Alerts are on for this device.");
          setShouldShowEnablePush(false);
          return;
        }
      }
      if (!vapidKey) {
        toast.error("Alerts aren't available right now.");
        return;
      }
      const sub = await subscribeUserToPush(vapidKey);
      if (!sub) {
        toast.error(
          "Alerts are blocked. Allow notifications in your browser settings.",
        );
        return;
      }
      await saveSubscription({ subscription: serializeSubscription(sub) });
      toast.success("Alerts are on for this device.");
      setShouldShowEnablePush(false);
    } catch {
      toast.error("Couldn't turn on alerts. Try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isAuthenticated) return null;

  const handleUserSelect = (userId: string, username?: string) => {
    if (pendingUserId) return;
    if (inviteLobbyId) {
      // Handle lobby invite - we need to get the username first
      const conversation = conversations.find(
        (c: any) => c.otherParticipant.id === userId,
      );
      const recipientUsername =
        username || conversation?.otherParticipant.username;

      if (recipientUsername) {
        setPendingUserId(userId);
        sendMessage({
          recipientUsername,
          content: `Join my lobby`,
          messageType: "lobby_invite",
          lobbyId: inviteLobbyId as Id<"lobbies">,
        })
          .then(() => {
            toast.success(`Lobby invite sent to ${recipientUsername}.`);
            setShowNewMessage(false);
            onClose(); // Close the messaging panel after sending invite
          })
          .catch((error: any) => {
            console.error("Failed to send lobby invite:", error);
            toast.error("Couldn't send the invite. Try again.");
          })
          .finally(() => setPendingUserId(null));
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

  const lastMessagePreview = (conversation: any) => {
    const last = conversation.lastMessage;
    if (!last) {
      return <span className="text-foreground/70">No messages yet</span>;
    }
    if (last.messageType === "lobby_invite") {
      return (
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5 shrink-0" />
          Lobby invite
        </span>
      );
    }
    if (last.messageType === "game_invite") {
      return (
        <span className="inline-flex items-center gap-1.5">
          <Eye className="size-3.5 shrink-0" />
          Game to watch
        </span>
      );
    }
    const mine =
      currentProfile &&
      last.senderId === currentProfile.userId &&
      conversation.otherParticipant.username !== NOTIFICATIONS_NAME;
    return (
      <>
        {mine && <span className="text-foreground/60">You: </span>}
        {truncateMessage(last.content)}
      </>
    );
  };

  const title = showNewMessage
    ? inviteLobbyId
      ? "Invite to lobby"
      : "New message"
    : "Messages";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        aria-describedby={undefined}
        className="flex w-full flex-col gap-0 bg-card p-0 text-foreground focus:outline-none focus-visible:outline-none sm:max-w-md"
        tabIndex={-1}
      >
        {selectedConversation ? (
          <SheetTitle className="sr-only">Conversation</SheetTitle>
        ) : (
          <SheetHeader className="shrink-0 flex-row items-center gap-2 space-y-0 border-b border-border py-3 pl-4 pr-14 text-left">
            {showNewMessage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNewMessage(false)}
                aria-label="Back to messages"
                className="-ml-2 h-10 w-10 shrink-0"
              >
                <ArrowLeft />
              </Button>
            )}
            <SheetTitle className="min-w-0 truncate">{title}</SheetTitle>
            {!showNewMessage && unreadCount > 0 && (
              <span
                className="rounded bg-primary px-1.5 text-xs font-semibold leading-5 tabular-nums text-primary-foreground"
                aria-label={`${unreadCount} unread`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            {!showNewMessage && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNewMessage}
                className="ml-auto shrink-0"
              >
                <Plus />
                New message
              </Button>
            )}
          </SheetHeader>
        )}

        <div className="min-h-0 flex-1">
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
              pendingUserId={pendingUserId}
              shouldShowEnablePush={shouldShowEnablePush}
              isSubscribing={isSubscribing}
              onEnablePush={() => void handleEnablePush()}
              getOnlineStatusIndicator={getOnlineStatusIndicator}
            />
          ) : (
            <div className="flex h-full flex-col">
              <div className="space-y-3 border-b border-border p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
                  <Input
                    placeholder="Search your messages"
                    aria-label="Search your messages"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {shouldShowEnablePush && (
                  <PushPrompt
                    isSubscribing={isSubscribing}
                    onEnablePush={() => void handleEnablePush()}
                  />
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {conversationsLoading ? (
                  <ListSkeleton />
                ) : filteredConversations.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-8 py-12 text-center">
                    <p className="text-base font-medium text-foreground">
                      {debouncedSearchTerm
                        ? `No messages from "${debouncedSearchTerm}"`
                        : "No messages yet"}
                    </p>
                    <p className="mt-1 max-w-xs text-sm text-foreground/75">
                      {debouncedSearchTerm
                        ? "Check the spelling or clear the search."
                        : "Start a conversation with another player."}
                    </p>
                    {!debouncedSearchTerm && (
                      <Button onClick={handleNewMessage} className="mt-5">
                        <Plus />
                        New message
                      </Button>
                    )}
                  </div>
                ) : (
                  <motion.ul
                    variants={stagger(0.03)}
                    initial="hidden"
                    animate="show"
                    className="p-2"
                  >
                    {filteredConversations.map((conversation: any) => {
                      const unread = conversation.unreadCount > 0;
                      const name = conversation.otherParticipant.username;
                      return (
                        <motion.li key={conversation._id} variants={fadeUp}>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedConversation(
                                conversation.otherParticipant.id,
                              )
                            }
                            className={cn(
                              "flex min-h-16 w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:bg-white/[0.1]",
                              unread && "bg-gold-500/[0.05]",
                            )}
                          >
                            <ParticipantAvatar
                              username={name}
                              avatarUrl={
                                conversation.otherParticipant.avatarUrl
                              }
                              frame={conversation.otherParticipant.avatarFrame}
                              indicator={
                                name !== NOTIFICATIONS_NAME
                                  ? getOnlineStatusIndicator(name)
                                  : null
                              }
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <UserNameWithBadge
                                  username={name}
                                  tier={conversation.otherParticipant.tier}
                                  isDonor={
                                    conversation.otherParticipant.isDonor
                                  }
                                  usernameColor={
                                    conversation.otherParticipant.usernameColor
                                  }
                                  size="md"
                                  className={cn(
                                    unread && "[&>span]:font-semibold",
                                  )}
                                />
                                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                  {formatTime(conversation.lastMessageAt)}
                                </span>
                              </div>

                              <div className="mt-0.5 flex items-center gap-2">
                                <p
                                  className={cn(
                                    "min-w-0 flex-1 truncate text-sm",
                                    unread
                                      ? "text-foreground"
                                      : "text-foreground/75",
                                  )}
                                >
                                  {lastMessagePreview(conversation)}
                                </p>
                                {unread && (
                                  <span
                                    className="shrink-0 rounded bg-primary px-1.5 text-xs font-semibold leading-5 tabular-nums text-primary-foreground"
                                    aria-label={`${conversation.unreadCount} unread`}
                                  >
                                    {conversation.unreadCount > 9
                                      ? "9+"
                                      : conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
