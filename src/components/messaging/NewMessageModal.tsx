import { useState } from "react";
import { Search } from "lucide-react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { UserAvatar } from "../UserAvatar";
import { useDebounce } from "use-debounce";

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string, username?: string) => void;
  inviteLobbyId?: string | null;
}

interface SearchResult {
  userId: string;
  username: string;
  avatarUrl?: string;
  rank?: string;
  avatarFrame?: string;
}

export function NewMessageModal({
  isOpen,
  onClose,
  onSelectUser,
  inviteLobbyId,
}: NewMessageModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce search term to avoid too many queries
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const { data: searchResults = [], isLoading: searchLoading } = useConvexQuery(
    api.messages.searchUsers,
    debouncedSearchTerm.length >= 2
      ? { searchTerm: debouncedSearchTerm }
      : "skip",
  );

  const handleSelectUser = (userId: string, username?: string) => {
    onSelectUser(userId, username);
    setSearchTerm("");
  };

  const handleClose = () => {
    onClose();
    setSearchTerm("");
  };

  const actionLabel = inviteLobbyId ? "Invite" : "Message";
  const isSearching = debouncedSearchTerm.length >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {inviteLobbyId ? "Invite to lobby" : "New message"}
          </DialogTitle>
          <DialogDescription>
            Type at least 2 letters of a username.
          </DialogDescription>
        </DialogHeader>

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

        <div className="max-h-72 min-h-24 overflow-y-auto">
          {isSearching && searchLoading ? (
            <div className="space-y-1" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2">
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : !isSearching ? null : searchResults.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-foreground/80">
              No player found for "{debouncedSearchTerm}". Check the spelling.
            </p>
          ) : (
            <ul>
              {searchResults.map((user: SearchResult) => (
                <li key={user.userId}>
                  <button
                    type="button"
                    onClick={() => handleSelectUser(user.userId, user.username)}
                    className="flex min-h-14 w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:bg-white/[0.1]"
                  >
                    <UserAvatar
                      username={user.username}
                      avatarUrl={user.avatarUrl}
                      size="md"
                      frame={user.avatarFrame}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {user.username}
                      </p>
                      {user.rank && (
                        <p className="truncate text-xs text-foreground/75">
                          {user.rank}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm text-foreground/80">
                      {actionLabel}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
