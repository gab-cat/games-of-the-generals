"use client";

import { forwardRef, useState, useRef, useCallback, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";
import { UserAvatar } from "../UserAvatar";



interface MentionInputWithDropdownProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  handleSendMessage: () => void;
  onlineUsers?: Array<{ username: string; avatarUrl?: string; rank?: string; userId: string; avatarFrame?: string }>;
}

// Online user interface - no need for rank colors/icons since we're simplifying

export const MentionInputWithDropdown = forwardRef<HTMLInputElement, MentionInputWithDropdownProps>(
  ({
    value,
    onChange,
    placeholder,
    maxLength,
    className,
    handleSendMessage,
    onlineUsers = [],
    ...props
  }, ref) => {
    const [cursorPosition, setCursorPosition] = useState(0);
    const [mentionQuery, setMentionQuery] = useState("");
    const [commandQuery, setCommandQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [dropdownType, setDropdownType] = useState<'mention' | 'command'>('mention');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Use the forwarded ref or our internal ref
    const actualInputRef = ref || inputRef;

    // Available commands
    const availableCommands = [
      { command: 'help', description: 'Show available commands' },
      { command: 'rules', description: 'Display chat rules' },
      { command: 'online', description: 'Show online users' },
      { command: 'me', description: 'Roleplaying action' },
      { command: 'clear', description: 'Clear chat history' },
    ];

    // Online users are passed as props from parent component

    // Debounce the mention query for 500ms
    const [debouncedMentionQuery] = useDebounce(mentionQuery, 500);

    // Filter users based on debounced query
    const filteredUsers = onlineUsers.filter((user) =>
      user.username?.toLowerCase().includes(debouncedMentionQuery.toLowerCase())
    );

    // Filter commands based on query
    const filteredCommands = availableCommands.filter((cmd) =>
      cmd.command.toLowerCase().includes(commandQuery.toLowerCase())
    );

    const handleInputFocus = useCallback(() => {
      // Input is focused
    }, []);

    const handleInputBlur = useCallback(() => {
      // Handle input blur - close dropdown if not clicking on dropdown items
      setTimeout(() => {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
          setSelectedIndex(-1);
        }
      }, 150); // Small delay to allow click events on dropdown items
    }, [isDropdownOpen]);

    const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      // If clicking on the container (not the dropdown), ensure input can be focused
      if (e.target === containerRef.current && actualInputRef && 'current' in actualInputRef && actualInputRef.current) {
        actualInputRef.current.focus();
      }
    }, [actualInputRef]);

    const handleMentionSelect = useCallback((username: string) => {
      // Find the @mention start position
      const textBeforeCursor = value.slice(0, cursorPosition);
      const mentionStart = textBeforeCursor.lastIndexOf("@");

      if (mentionStart !== -1) {
        // Replace the mention with the selected username
        const beforeMention = value.slice(0, mentionStart);
        const afterMention = value.slice(cursorPosition);
        const newValue = beforeMention + "@" + username + " " + afterMention;

        onChange(newValue);

        // Update cursor position
        const newCursorPosition = mentionStart + username.length + 2; // +2 for @ and space
        setTimeout(() => {
          if (actualInputRef && 'current' in actualInputRef && actualInputRef.current) {
            actualInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
            actualInputRef.current.focus();
          }
        }, 0);

        // Close dropdown and clear mention state
        setIsDropdownOpen(false);
        setMentionQuery("");
        setSelectedIndex(-1);
      }
    }, [value, cursorPosition, onChange, actualInputRef]);

    const handleCommandSelect = useCallback((command: string) => {
      // Find the /command start position
      const textBeforeCursor = value.slice(0, cursorPosition);
      const commandStart = textBeforeCursor.lastIndexOf("/");

      if (commandStart !== -1) {
        // Replace the command with the selected command
        const beforeCommand = value.slice(0, commandStart);
        const afterCommand = value.slice(cursorPosition);
        const newValue = beforeCommand + "/" + command + " " + afterCommand;

        onChange(newValue);

        // Update cursor position
        const newCursorPosition = commandStart + command.length + 2; // +2 for / and space
        setTimeout(() => {
          if (actualInputRef && 'current' in actualInputRef && actualInputRef.current) {
            actualInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
            actualInputRef.current.focus();
          }
        }, 0);

        // Close dropdown and clear command state
        setIsDropdownOpen(false);
        setCommandQuery("");
        setSelectedIndex(-1);
      }
    }, [value, cursorPosition, onChange, actualInputRef]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const newCursorPosition = e.target.selectionStart || 0;

      setCursorPosition(newCursorPosition);
      onChange(newValue);

      // Check for mention trigger (allow dashes in usernames)
      const textBeforeCursor = newValue.slice(0, newCursorPosition);
      const mentionMatch = textBeforeCursor.match(/(@([\w-]*)$)/);
      const commandMatch = textBeforeCursor.match(/(\/(\w*)$)/);

      if (mentionMatch) {
        const query = mentionMatch[2]; // Use second capture group for username without @
        setMentionQuery(query);
        setDropdownType('mention');
        setIsDropdownOpen(true);
        setSelectedIndex(-1); // Reset selection
      } else if (commandMatch) {
        const query = commandMatch[2]; // Use second capture group for command without /
        setCommandQuery(query);
        setDropdownType('command');
        setIsDropdownOpen(true);
        setSelectedIndex(-1); // Reset selection
      } else {
        setMentionQuery("");
        setCommandQuery("");
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      }
    }, [onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      // Handle dropdown navigation when open
      if (isDropdownOpen) {
        const items = dropdownType === 'mention' ? filteredUsers : filteredCommands;
        if (items.length > 0) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % items.length);
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => prev <= 0 ? items.length - 1 : prev - 1);
            return;
          }
          if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault();
            if (dropdownType === 'mention') {
              handleMentionSelect(filteredUsers[selectedIndex].username!);
            } else {
              handleCommandSelect(filteredCommands[selectedIndex].command);
            }
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setIsDropdownOpen(false);
            setSelectedIndex(-1);
            return;
          }
        }
      }

      // Handle arrow keys for cursor position updates (when dropdown is closed)
      if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
        setTimeout(() => {
          if (actualInputRef && 'current' in actualInputRef && actualInputRef.current) {
            setCursorPosition(actualInputRef.current.selectionStart || 0);
          }
        }, 0);
        return;
      }

      // For Enter key when dropdown is closed, let it bubble up to parent
      if (e.key === "Enter" && !isDropdownOpen) {
        handleSendMessage();
        return;
      }
    }, [actualInputRef, handleSendMessage, isDropdownOpen, dropdownType, filteredUsers, filteredCommands, selectedIndex, handleMentionSelect, handleCommandSelect]);

    // Handle clicking outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false);
          setSelectedIndex(-1);
        }
      };

      if (isDropdownOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isDropdownOpen]);



    return (
      <div ref={containerRef} onClick={handleContainerClick} className="relative w-full text-sm">
        <input
          {...props}
          ref={actualInputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "w-full bg-black/20 border border-white/10 text-white placeholder:text-white/50",
            "focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/30",
            "rounded-full px-2 py-2 text-xs",
            "transition-all duration-200",
            className
          )}
        />

        {/* Simple dropdown without Radix UI focus management */}
        {isDropdownOpen && (
          <div className="absolute bottom-full left-0 right-0 z-50 w-64 max-h-48 overflow-y-auto rounded-2xl bg-gray-950/80 backdrop-blur-xl border border-white/20 p-1 mb-2 shadow-lg no-scrollbar">
            {dropdownType === 'mention' ? (
              <>
                {filteredUsers.length === 0 && debouncedMentionQuery ? (
                  <div className="text-center text-white/60 text-sm py-4 px-2">
                    No users found matching "{debouncedMentionQuery}"
                  </div>
                ) : (
                  <>
                    {filteredUsers.map((user, index) => (
                      <div
                        key={user.userId}
                        onClick={() => handleMentionSelect(user.username!)}
                        className={cn(
                          "flex items-center gap-3 px-2 py-1 mb-1 cursor-pointer rounded-2xl transition-all",
                          selectedIndex === index
                            ? "bg-white/20"
                            : "hover:bg-white/10"
                        )}
                      >
                        {/* Avatar */}
                        <UserAvatar
                          username={user.username!}
                          avatarUrl={user.avatarUrl}
                          rank={user.rank}
                          size="xs"
                          frame={user.avatarFrame}
                          className="ring-1 ring-white/20 flex-shrink-0"
                        />

                        {/* Username */}
                        <span className="text-white/90 text-sm truncate flex-1">
                          {user.username}
                        </span>

                        {/* Green dot for online status */}
                        <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                      </div>
                    ))}
                  </>
                )}
              </>
            ) : (
              <>
                {filteredCommands.length === 0 && commandQuery ? (
                  <div className="text-center text-white/60 text-sm py-4 px-2">
                    No commands found matching "{commandQuery}"
                  </div>
                ) : (
                  <>
                    {filteredCommands.map((cmd, index) => (
                      <div
                        key={cmd.command}
                        onClick={() => handleCommandSelect(cmd.command)}
                        className={cn(
                          "flex items-center gap-3 px-2 py-1 mb-1 cursor-pointer rounded-2xl transition-all",
                          selectedIndex === index
                            ? "bg-white/20"
                            : "hover:bg-white/10"
                        )}
                      >
                        {/* Command icon */}
                        <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-300 text-xs font-bold">/</span>
                        </div>

                        {/* Command name and description */}
                        <div className="flex-1 min-w-0">
                          <div className="text-white/90 text-xs font-medium truncate">
                            /{cmd.command}
                          </div>
                          <div className="text-white/60 text-xs truncate">
                            {cmd.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

MentionInputWithDropdown.displayName = "MentionInputWithDropdown";
