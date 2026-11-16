"use client";

import { forwardRef, useState, useRef, useCallback, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";
import { UserAvatar } from "../UserAvatar";

interface MentionInputWithDropdownProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  handleSendMessage: () => void;
  onlineUsers?: Array<{
    username: string;
    avatarUrl?: string;
    rank?: string;
    userId: string;
    avatarFrame?: string;
  }>;
}

// Online user interface - no need for rank colors/icons since we're simplifying

export const MentionInputWithDropdown = forwardRef<
  HTMLInputElement,
  MentionInputWithDropdownProps
>(
  (
    {
      value,
      onChange,
      placeholder,
      maxLength,
      className,
      handleSendMessage,
      onlineUsers = [],
      ...props
    },
    ref,
  ) => {
    const [cursorPosition, setCursorPosition] = useState(0);
    const [mentionQuery, setMentionQuery] = useState("");
    const [commandQuery, setCommandQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [dropdownType, setDropdownType] = useState<"mention" | "command">(
      "mention",
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Use the forwarded ref or our internal ref
    const actualInputRef = ref || inputRef;

    // Available commands
    const availableCommands = [
      { command: "help", description: "Show available commands" },
      { command: "rules", description: "Display chat rules" },
      { command: "online", description: "Show online users" },
      { command: "me", description: "Roleplaying action" },
      { command: "clear", description: "Clear chat history" },
    ];

    // Online users are passed as props from parent component

    // Debounce the mention query for 500ms
    const [debouncedMentionQuery] = useDebounce(mentionQuery, 500);

    // Filter users based on debounced query
    const filteredUsers = onlineUsers.filter((user) =>
      user.username
        ?.toLowerCase()
        .includes(debouncedMentionQuery.toLowerCase()),
    );

    // Filter commands based on query
    const filteredCommands = availableCommands.filter((cmd) =>
      cmd.command.toLowerCase().includes(commandQuery.toLowerCase()),
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

    const handleContainerClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        // If clicking on the container (not the dropdown), ensure input can be focused
        if (
          e.target === containerRef.current &&
          actualInputRef &&
          "current" in actualInputRef &&
          actualInputRef.current
        ) {
          actualInputRef.current.focus();
        }
      },
      [actualInputRef],
    );

    const handleMentionSelect = useCallback(
      (username: string) => {
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
            if (
              actualInputRef &&
              "current" in actualInputRef &&
              actualInputRef.current
            ) {
              actualInputRef.current.setSelectionRange(
                newCursorPosition,
                newCursorPosition,
              );
              actualInputRef.current.focus();
            }
          }, 0);

          // Close dropdown and clear mention state
          setIsDropdownOpen(false);
          setMentionQuery("");
          setSelectedIndex(-1);
        }
      },
      [value, cursorPosition, onChange, actualInputRef],
    );

    const handleCommandSelect = useCallback(
      (command: string) => {
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
            if (
              actualInputRef &&
              "current" in actualInputRef &&
              actualInputRef.current
            ) {
              actualInputRef.current.setSelectionRange(
                newCursorPosition,
                newCursorPosition,
              );
              actualInputRef.current.focus();
            }
          }, 0);

          // Close dropdown and clear command state
          setIsDropdownOpen(false);
          setCommandQuery("");
          setSelectedIndex(-1);
        }
      },
      [value, cursorPosition, onChange, actualInputRef],
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setDropdownType("mention");
          setIsDropdownOpen(true);
          setSelectedIndex(-1); // Reset selection
        } else if (commandMatch) {
          const query = commandMatch[2]; // Use second capture group for command without /
          setCommandQuery(query);
          setDropdownType("command");
          setIsDropdownOpen(true);
          setSelectedIndex(-1); // Reset selection
        } else {
          setMentionQuery("");
          setCommandQuery("");
          setIsDropdownOpen(false);
          setSelectedIndex(-1);
        }
      },
      [onChange],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Handle dropdown navigation when open
        if (isDropdownOpen) {
          const items =
            dropdownType === "mention" ? filteredUsers : filteredCommands;
          if (items.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedIndex((prev) => (prev + 1) % items.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedIndex((prev) =>
                prev <= 0 ? items.length - 1 : prev - 1,
              );
              return;
            }
            if (e.key === "Enter" && selectedIndex >= 0) {
              e.preventDefault();
              if (dropdownType === "mention") {
                handleMentionSelect(filteredUsers[selectedIndex].username!);
              } else {
                handleCommandSelect(filteredCommands[selectedIndex].command);
              }
              return;
            }
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setIsDropdownOpen(false);
            setSelectedIndex(-1);
            return;
          }
        }

        // Handle arrow keys for cursor position updates (when dropdown is closed)
        if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
          setTimeout(() => {
            if (
              actualInputRef &&
              "current" in actualInputRef &&
              actualInputRef.current
            ) {
              setCursorPosition(actualInputRef.current.selectionStart || 0);
            }
          }, 0);
          return;
        }

        // For Enter key when dropdown is closed, let it bubble up to parent
        if (
          e.key === "Enter" &&
          !isDropdownOpen &&
          !e.nativeEvent.isComposing
        ) {
          handleSendMessage();
          return;
        }
      },
      [
        actualInputRef,
        handleSendMessage,
        isDropdownOpen,
        dropdownType,
        filteredUsers,
        filteredCommands,
        selectedIndex,
        handleMentionSelect,
        handleCommandSelect,
      ],
    );

    // Handle clicking outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsDropdownOpen(false);
          setSelectedIndex(-1);
        }
      };

      if (isDropdownOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isDropdownOpen]);

    const listboxId = "chat-suggestions";
    const noMatches =
      dropdownType === "mention"
        ? filteredUsers.length === 0 && !!debouncedMentionQuery
        : filteredCommands.length === 0 && !!commandQuery;

    return (
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className="relative w-full"
      >
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
          autoComplete="off"
          enterKeyHint="send"
          role="combobox"
          aria-expanded={isDropdownOpen}
          aria-controls={isDropdownOpen ? listboxId : undefined}
          aria-autocomplete="list"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-white/[0.04] px-3 text-base text-foreground md:text-sm",
            "placeholder:text-muted-foreground transition-colors hover:border-border-strong",
            "focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            className,
          )}
        />

        {/* Plain list, no Radix focus management, so typing never loses focus */}
        {isDropdownOpen && (
          <div
            id={listboxId}
            role="listbox"
            onMouseDown={(e) => e.preventDefault()}
            className="no-scrollbar absolute inset-x-0 bottom-full z-50 mb-2 max-h-56 overflow-y-auto rounded-lg border border-border-strong bg-popover p-1 shadow-lg"
          >
            {noMatches ? (
              <div className="px-3 py-3 text-sm text-foreground/80">
                {dropdownType === "mention"
                  ? `No online player matches "${debouncedMentionQuery}".`
                  : `No command matches "${commandQuery}".`}
              </div>
            ) : dropdownType === "mention" ? (
              filteredUsers.map((user, index) => (
                <button
                  key={user.userId}
                  type="button"
                  role="option"
                  aria-selected={selectedIndex === index}
                  onClick={() => handleMentionSelect(user.username!)}
                  className={cn(
                    "flex min-h-10 w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                    selectedIndex === index
                      ? "bg-white/[0.1]"
                      : "hover:bg-white/[0.06]",
                  )}
                >
                  <UserAvatar
                    username={user.username!}
                    avatarUrl={user.avatarUrl}
                    rank={user.rank}
                    size="xs"
                    frame={user.avatarFrame}
                    className="shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {user.username}
                  </span>
                  <span
                    className="size-2 shrink-0 rounded-full bg-emerald-400"
                    aria-label="Online"
                  />
                </button>
              ))
            ) : (
              filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.command}
                  type="button"
                  role="option"
                  aria-selected={selectedIndex === index}
                  onClick={() => handleCommandSelect(cmd.command)}
                  className={cn(
                    "flex min-h-10 w-full flex-col justify-center rounded-md px-2 py-1.5 text-left transition-colors",
                    selectedIndex === index
                      ? "bg-white/[0.1]"
                      : "hover:bg-white/[0.06]",
                  )}
                >
                  <span className="text-sm text-foreground">
                    /{cmd.command}
                  </span>
                  <span className="truncate text-xs text-foreground/75">
                    {cmd.description}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  },
);

MentionInputWithDropdown.displayName = "MentionInputWithDropdown";
