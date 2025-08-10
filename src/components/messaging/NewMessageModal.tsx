import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MessageCircle } from "lucide-react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UserAvatar } from "../UserAvatar";
import { cn } from "../../lib/utils";
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
}

export function NewMessageModal({ isOpen, onClose, onSelectUser, inviteLobbyId }: NewMessageModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<{userId: string, username: string} | null>(null);
  
  // Debounce search term to avoid too many queries
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const { data: searchResults = [], isLoading: searchLoading } = useConvexQuery(
    api.messages.searchUsers,
    debouncedSearchTerm.length >= 2 ? { searchTerm: debouncedSearchTerm } : "skip"
  );

  const handleSelectUser = (userId: string, username?: string) => {
    onSelectUser(userId, username);
    setSearchTerm("");
    setSelectedUser(null);
  };

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setSelectedUser(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-61"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  {inviteLobbyId ? "Send Lobby Invite" : "New Message"}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="p-1 text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-6 space-y-4">
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

              {/* Search Results */}
              <div className="space-y-2">
                {searchLoading && debouncedSearchTerm.length >= 2 ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                    <p className="text-white/60 text-sm mt-2">Searching...</p>
                  </div>
                ) : debouncedSearchTerm.length < 2 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 mb-2">Search for players</p>
                    <p className="text-sm text-white/40">
                      Type at least 2 characters to search for players to message
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-6 h-6 text-white/40" />
                    </div>
                    <p className="text-white/60 mb-2">No players found</p>
                    <p className="text-sm text-white/40">
                      Try a different username
                    </p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {searchResults.map((user: SearchResult) => (
                      <motion.div
                        key={user.userId}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                          selectedUser?.userId === user.userId
                            ? "bg-blue-600/20 border border-blue-500/50"
                            : "hover:bg-white/10"
                        )}
                        onClick={() => setSelectedUser({userId: user.userId, username: user.username})}
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
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectUser(user.userId, user.username);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {inviteLobbyId ? "Send Invite" : "Message"}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            {selectedUser && (
              <div className="p-6 border-t border-white/10">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => selectedUser && handleSelectUser(selectedUser.userId, selectedUser.username)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {inviteLobbyId ? "Send Invite" : "Start Chat"}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
